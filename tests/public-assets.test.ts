import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { syncBackgroundSvgs, syncFontAssets } from "../src/internal/public-assets";

const temporary: string[] = [];
afterEach(() => {
    for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true });
});

describe("theme public assets after config resolution", () => {
    it("uses the resolved public directory, preserves custom files and skips unchanged writes", () => {
        const root = mkdtempSync(path.join(tmpdir(), "stalux-public-assets-"));
        temporary.push(root);
        const source = path.join(root, "package/src");
        const publicDir = path.join(root, "consumer/custom-static");
        for (const directory of [
            source,
            path.join(source, "../public/background"),
            path.join(source, "../public/fonts"),
            path.join(publicDir, "background"),
        ])
            mkdirSync(directory, { recursive: true });
        const background = path.join(source, "../public/background/theme.svg");
        writeFileSync(background, "<svg/>");
        writeFileSync(path.join(source, "../public/background/ignore.txt"), "ignore");
        writeFileSync(path.join(source, "../public/fonts/math.woff2"), "font");
        writeFileSync(path.join(source, "../public/fonts/LICENSE.txt"), "license");
        writeFileSync(path.join(source, "../public/fonts/ignore.ttf"), "ignore");
        writeFileSync(path.join(publicDir, "background/custom.svg"), "custom");
        expect(syncBackgroundSvgs(source, publicDir)).toEqual({ copied: 1, skipped: 0 });
        syncFontAssets(source, publicDir);
        const destination = path.join(publicDir, "background/theme.svg");
        const mtime = statSync(destination).mtimeMs;
        expect(syncBackgroundSvgs(source, publicDir)).toEqual({ copied: 0, skipped: 1 });
        expect(statSync(destination).mtimeMs).toBe(mtime);
        expect(readFileSync(path.join(publicDir, "fonts/math.woff2"), "utf8")).toBe("font");
        expect(readFileSync(path.join(publicDir, "fonts/LICENSE.txt"), "utf8")).toBe("license");
        writeFileSync(background, "<svg>updated</svg>");
        expect(syncBackgroundSvgs(source, publicDir)).toEqual({ copied: 1, skipped: 0 });
        expect(readFileSync(destination, "utf8")).toBe("<svg>updated</svg>");
        expect(readFileSync(path.join(publicDir, "background/custom.svg"), "utf8")).toBe("custom");
        expect(() => statSync(path.join(publicDir, "fonts/ignore.ttf"))).toThrow();
        expect(() => statSync(path.join(publicDir, "background/ignore.txt"))).toThrow();
        writeFileSync(path.join(source, "../public/background/theme.webp"), "raster");
        expect(syncBackgroundSvgs(source, publicDir)).toEqual({ copied: 1, skipped: 1 });
        expect(readFileSync(path.join(publicDir, "background/theme.webp"), "utf8")).toBe("raster");
        expect(syncBackgroundSvgs(source, publicDir)).toEqual({ copied: 0, skipped: 2 });
        syncFontAssets(source, publicDir);
        expect(syncBackgroundSvgs(path.join(root, "missing/src"), publicDir)).toEqual({
            copied: 0,
            skipped: 0,
        });
        syncFontAssets(path.join(root, "missing/src"), publicDir);
    });
});
