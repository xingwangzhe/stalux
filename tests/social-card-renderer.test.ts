import { createHash } from "node:crypto";
import {
    copyFile,
    mkdir,
    mkdtemp,
    readdir,
    readFile,
    rm,
    truncate,
    utimes,
    writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Renderer } from "@takumi-rs/core";
import { imageSize } from "image-size";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderSocialCard, type SocialCardPaths } from "../src/internal/social-card-renderer";
import type { SocialCardData } from "../src/utils/social-image";

const fontPath = fileURLToPath(
    new URL("../src/assets/fonts/LXGWWenKai-Regular.ttf", import.meta.url),
);
const artwork = await readFile(new URL("../public/avatar.png", import.meta.url));
const data: SocialCardData = {
    title: "中文标题与 Astro / Vite",
    description: "构建时生成社交分享卡片，浏览器无需加载渲染器。",
    siteTitle: "测试博客",
    author: "xingwangzhe",
    host: "example.com",
    lang: "zh-CN",
    accent: "#64FFDA",
    date: "2026-10-25",
    category: "技术",
};
let root: string;
let paths: SocialCardPaths;

beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "stalux-card-test-"));
    paths = {
        publicDir: path.join(root, "public"),
        cacheDir: path.join(root, "cache"),
        base: "/",
        fontPath,
    };
    await mkdir(paths.publicDir);
});
afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await rm(root, { recursive: true, force: true });
});

function expectImage(bytes: Buffer, format: "png" | "webp") {
    expect(imageSize(bytes)).toMatchObject({ type: format, width: 1200, height: 630 });
}

describe("Takumi social-card rendering", () => {
    it.each(["webp", "png"] as const)(
        "renders a real %s with the bundled Chinese font and no network",
        async (format) => {
            const fetcher = vi.fn();
            vi.stubGlobal("fetch", fetcher);
            const warn = vi.fn();
            expectImage(await renderSocialCard(data, paths, warn, format), format);
            expect(fetcher).not.toHaveBeenCalled();
            expect(warn).not.toHaveBeenCalled();
        },
    );

    it("uses the encoded local cover under a deployment base", async () => {
        await writeFile(path.join(paths.publicDir, "封面.png"), artwork);
        const warn = vi.fn();
        const render = vi.spyOn(Renderer.prototype, "render");
        const bytes = await renderSocialCard(
            { ...data, cover: "/blog/%E5%B0%81%E9%9D%A2.png" },
            { ...paths, base: "/blog/" },
            warn,
        );
        expectImage(bytes, "webp");
        expect(render.mock.calls[0]?.[1]?.images).toEqual([{ src: "stalux-cover", data: artwork }]);
        expect(warn).not.toHaveBeenCalled();
    });

    it("fits a real mixed Chinese/English long title inside its available height", async () => {
        const title =
            "发布 @xingwangzhe/satteri-mermaid：剔除mermaid.js，用Rust原生渲染流程图，构建时产出纯静态SVG";
        const measure = vi.spyOn(Renderer.prototype, "measure");
        expectImage(await renderSocialCard({ ...data, title }, paths, vi.fn()), "webp");
        expect(measure).toHaveBeenCalled();
        const last = measure.mock.calls.at(-1)?.[0];
        expect(last).toMatchObject({ type: "text", text: title });
        const measured = await measure.mock.results.at(-1)?.value;
        expect(measured.height).toBeLessThanOrEqual(250);
    });

    it("restores identical encoded bytes from the persistent render cache", async () => {
        const render = vi.spyOn(Renderer.prototype, "render");
        const first = await renderSocialCard(data, paths, vi.fn());
        const second = await renderSocialCard(data, paths, vi.fn());
        expect(second).toEqual(first);
        expect(render).toHaveBeenCalledTimes(1);
        expect(
            (await readdir(paths.cacheDir)).filter((name) => name.endsWith(".webp")),
        ).toHaveLength(1);
    });

    it("shares downloaded artwork between WebP and PNG output and caches its bytes", async () => {
        const cover = "https://images.example.com/cover.png";
        const fetcher = vi.fn(
            async () =>
                new Response(new Uint8Array(artwork), { headers: { "Content-Type": "image/png" } }),
        );
        vi.stubGlobal("fetch", fetcher);
        const warn = vi.fn();
        expectImage(await renderSocialCard({ ...data, cover }, paths, warn), "webp");
        expectImage(await renderSocialCard({ ...data, cover }, paths, warn, "png"), "png");
        expect(fetcher).toHaveBeenCalledTimes(1);
        const key = createHash("sha256").update(cover).digest("hex");
        expect(await readFile(path.join(paths.cacheDir, "covers", key))).toEqual(artwork);
        expect(warn).not.toHaveBeenCalled();
    });

    it("reads a fresh remote-artwork disk cache without sending a request", async () => {
        const cover = "https://images.example.com/fresh.png";
        const cacheFile = path.join(
            paths.cacheDir,
            "covers",
            createHash("sha256").update(cover).digest("hex"),
        );
        await mkdir(path.dirname(cacheFile), { recursive: true });
        await writeFile(cacheFile, artwork);
        const fetcher = vi.fn();
        vi.stubGlobal("fetch", fetcher);
        expectImage(await renderSocialCard({ ...data, cover }, paths, vi.fn()), "webp");
        expect(fetcher).not.toHaveBeenCalled();
    });

    it("refreshes artwork after its 24-hour disk cache expires", async () => {
        const cover = "https://images.example.com/stale.png";
        const cacheFile = path.join(
            paths.cacheDir,
            "covers",
            createHash("sha256").update(cover).digest("hex"),
        );
        await mkdir(path.dirname(cacheFile), { recursive: true });
        await writeFile(cacheFile, artwork);
        const oldTime = new Date(Date.now() - 2 * 86_400_000);
        await utimes(cacheFile, oldTime, oldTime);
        const fetcher = vi.fn(
            async () =>
                new Response(new Uint8Array(artwork), { headers: { "Content-Type": "image/png" } }),
        );
        vi.stubGlobal("fetch", fetcher);
        expectImage(await renderSocialCard({ ...data, cover }, paths, vi.fn()), "webp");
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it.each([
        ["missing local file", "/missing.png"],
        ["non-web URL", "file:///private/cover.png"],
        ["HTML instead of an image", "https://images.example.com/not-an-image"],
        ["broken image bytes", "https://images.example.com/broken.png"],
    ])("falls back to a real title card for %s", async (_label, cover) => {
        vi.stubGlobal(
            "fetch",
            vi.fn(
                async () =>
                    new Response("not an image", {
                        headers: {
                            "Content-Type": cover.endsWith(".png") ? "image/png" : "text/html",
                        },
                    }),
            ),
        );
        const warn = vi.fn();
        expectImage(await renderSocialCard({ ...data, cover }, paths, warn), "webp");
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("回退标题卡片"));
    });

    it("rejects an oversized local cover before decoding it", async () => {
        const file = path.join(paths.publicDir, "oversized.png");
        await copyFile(new URL("../public/avatar.png", import.meta.url), file);
        await truncate(file, 8 * 1024 * 1024 + 1);
        const warn = vi.fn();
        expectImage(
            await renderSocialCard({ ...data, cover: "/oversized.png" }, paths, warn),
            "webp",
        );
        expect(warn).toHaveBeenCalledOnce();
    });

    it("recovers from native artwork decoding failure with a coverless render", async () => {
        await writeFile(path.join(paths.publicDir, "cover.png"), artwork);
        const render = vi
            .spyOn(Renderer.prototype, "render")
            .mockRejectedValueOnce(new Error("decode failed"));
        const warn = vi.fn();
        expectImage(await renderSocialCard({ ...data, cover: "/cover.png" }, paths, warn), "webp");
        expect(render).toHaveBeenCalledTimes(2);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("解码失败"));
    });

    it("propagates a renderer failure when there is no artwork to remove", async () => {
        vi.spyOn(Renderer.prototype, "render").mockRejectedValueOnce(
            new Error("renderer unavailable"),
        );
        await expect(renderSocialCard(data, paths, vi.fn())).rejects.toThrow(
            "renderer unavailable",
        );
    });
});
