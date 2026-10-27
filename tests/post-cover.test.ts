import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HtmlImage } from "../src/internal/html-images";
import { COVER_DIR, restoreCoverFiles, upgradeCoverImages } from "../src/internal/post-cover";

function image(src: string, marked = true): HtmlImage {
    const attributes = new Map<string, string>([["src", src]]);
    if (marked) attributes.set("data-stalux-cover", "");
    return {
        attributes,
        node: { attrs: [{ name: "src", value: src }] },
    } as unknown as HtmlImage;
}

function encoder(bytes = Buffer.from("encoded")) {
    const toBuffer = vi.fn(async () => bytes);
    const webp = vi.fn(() => ({ toBuffer }));
    const resize = vi.fn(() => ({ webp, toBuffer }));
    return { factory: vi.fn(() => ({ resize, webp, toBuffer })), resize, webp, toBuffer };
}

let root: string;
let outDir: string;
let cacheDir: string;

beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "stalux-cover-"));
    outDir = path.join(root, "dist");
    cacheDir = path.join(root, "cache");
    mkdirSync(path.join(outDir, "images"), { recursive: true });
    writeFileSync(path.join(outDir, "images", "cover.png"), "source-bytes");
});
afterEach(() => vi.restoreAllMocks());

describe("card cover output", () => {
    it("rewrites a marked raster cover to a content-addressed webp", async () => {
        const sharp = encoder();
        const cover = image("/images/cover.png");
        const converted = await upgradeCoverImages([cover], {
            outDir,
            cacheDir,
            sharp: sharp.factory as never,
        });
        expect(converted).toBe(1);
        expect(sharp.resize).toHaveBeenCalledWith({ width: 1280, withoutEnlargement: true });
        expect(sharp.webp).toHaveBeenCalledWith({ quality: 82, effort: 5 });
        expect(cover.node.attrs[0]?.value).toMatch(
            new RegExp(`^/${COVER_DIR}/[a-f0-9]{16}\\.webp$`, "u"),
        );
        expect(readdirSync(path.join(cacheDir, "v1"))).toHaveLength(1);
    });

    it("reuses the cached file instead of encoding the same source twice", async () => {
        const first = encoder();
        await upgradeCoverImages([image("/images/cover.png")], {
            outDir,
            cacheDir,
            sharp: first.factory as never,
        });
        const second = encoder();
        const cover = image("/images/cover.png");
        await upgradeCoverImages([cover], { outDir, cacheDir, sharp: second.factory as never });
        // Same bytes, same name, so nothing is re-encoded.
        expect(second.factory).not.toHaveBeenCalled();
        expect(cover.node.attrs[0]?.value).toMatch(/\.webp$/u);
    });

    it("leaves vectors, remote URLs and unmarked images alone", async () => {
        writeFileSync(path.join(outDir, "images", "logo.svg"), "<svg/>");
        const sharp = encoder();
        const images = [
            image("/images/logo.svg"),
            image("https://cdn.example.com/a.png"),
            image("/images/cover.png", false),
        ];
        const converted = await upgradeCoverImages(images, {
            outDir,
            cacheDir,
            sharp: sharp.factory as never,
        });
        expect(converted).toBe(0);
        expect(sharp.factory).not.toHaveBeenCalled();
        for (const entry of images) expect(entry.node.attrs[0]?.value).not.toContain(COVER_DIR);
    });

    it("keeps the original source when the encoder fails", async () => {
        const failing = {
            factory: vi.fn(() => ({
                resize: () => ({
                    webp: () => ({ toBuffer: async () => Promise.reject(new Error("boom")) }),
                }),
            })),
        };
        const cover = image("/images/cover.png");
        const warn = vi.fn();
        const converted = await upgradeCoverImages([cover], {
            outDir,
            cacheDir,
            sharp: failing.factory as never,
            logger: { warn },
        });
        expect(converted).toBe(0);
        expect(cover.node.attrs[0]?.value).toBe("/images/cover.png");
        expect(warn).toHaveBeenCalledOnce();
    });

    it("restores cached covers into the output for pages served from cache", async () => {
        mkdirSync(path.join(cacheDir, "v1"), { recursive: true });
        writeFileSync(path.join(cacheDir, "v1", "abc.webp"), "x");
        const copied = restoreCoverFiles({ outDir, cacheDir });
        expect(copied).toBe(1);
        expect(readdirSync(path.join(outDir, COVER_DIR))).toEqual(["abc.webp"]);
        // Nothing to restore is not an error.
        expect(restoreCoverFiles({ outDir, cacheDir: path.join(root, "absent") })).toBe(0);
    });
});
