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
import { imageSize } from "image-size";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    renderSocialCard,
    type SocialCardPaths,
    socialCardTree,
} from "../src/internal/social-card-renderer";
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

function expectImage(bytes: Buffer, format: "png" | "jpg") {
    expect(imageSize(bytes)).toMatchObject({ type: format, width: 1200, height: 630 });
}

describe("Satori social-card rendering", () => {
    it("renders a real PNG title card with the bundled Chinese font and no network", async () => {
        const fetcher = vi.fn();
        vi.stubGlobal("fetch", fetcher);
        const warn = vi.fn();
        expectImage(await renderSocialCard(data, paths, warn), "png");
        expect(fetcher).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
    });

    it("keeps the artwork in colour on a black-and-white card", async () => {
        const red = await sharp({
            create: { width: 400, height: 400, channels: 3, background: { r: 220, g: 20, b: 30 } },
        })
            .png()
            .toBuffer();
        await writeFile(path.join(paths.publicDir, "red.png"), red);
        const warn = vi.fn();
        const bytes = await renderSocialCard({ ...data, cover: "/red.png" }, paths, warn);
        expectImage(bytes, "jpg");
        const metadata = await sharp(bytes).metadata();
        expect(metadata.space).toBe("srgb");
        const { data: pixel } = await sharp(bytes)
            .extract({ left: 1100, top: 300, width: 1, height: 1 })
            .raw()
            .toBuffer({ resolveWithObject: true });
        expect(pixel[0]).toBeGreaterThan(170);
        expect(pixel[1]).toBeLessThan(80);
        expect(pixel[2]).toBeLessThan(90);
        const { data: paper } = await sharp(bytes)
            .extract({ left: 20, top: 300, width: 1, height: 1 })
            .raw()
            .toBuffer({ resolveWithObject: true });
        expect(Math.min(paper[0] ?? 0, paper[1] ?? 0, paper[2] ?? 0)).toBeGreaterThan(235);
        expect(warn).not.toHaveBeenCalled();
    });

    it("uses the encoded local cover under a deployment base", async () => {
        await writeFile(path.join(paths.publicDir, "封面.png"), artwork);
        const warn = vi.fn();
        expectImage(
            await renderSocialCard(
                { ...data, cover: "/blog/%E5%B0%81%E9%9D%A2.png" },
                { ...paths, base: "/blog/" },
                warn,
            ),
            "jpg",
        );
        expect(warn).not.toHaveBeenCalled();
    });

    it("keeps a long mixed Chinese/English title inside three clamped lines", async () => {
        const title =
            "发布 @xingwangzhe/satteri-mermaid：剔除mermaid.js，用Rust原生渲染流程图，构建时产出纯静态SVG，这是一段刻意超长的标题用来验证截断行为";
        const tree = socialCardTree({ ...data, title }, undefined);
        const titleNode = (
            tree.props.children as { props: { style: Record<string, unknown> } }[]
        )[2];
        expect(titleNode?.props.style).toMatchObject({
            fontSize: 58,
            lineClamp: 3,
            overflow: "hidden",
            display: "block",
        });
        expectImage(await renderSocialCard({ ...data, title }, paths, vi.fn()), "png");
    });

    it("restores identical encoded bytes from the persistent render cache", async () => {
        const first = await renderSocialCard(data, paths, vi.fn());
        const second = await renderSocialCard(data, paths, vi.fn());
        expect(second).toEqual(first);
        expect(
            (await readdir(paths.cacheDir)).filter((name) => name.endsWith(".png")),
        ).toHaveLength(1);
    });

    it("downloads remote artwork once and caches its bytes", async () => {
        const cover = "https://images.example.com/cover.png";
        const fetcher = vi.fn(
            async () =>
                new Response(new Uint8Array(artwork), { headers: { "Content-Type": "image/png" } }),
        );
        vi.stubGlobal("fetch", fetcher);
        const warn = vi.fn();
        expectImage(await renderSocialCard({ ...data, cover }, paths, warn), "jpg");
        expectImage(await renderSocialCard({ ...data, cover }, paths, warn), "jpg");
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
        expectImage(await renderSocialCard({ ...data, cover }, paths, vi.fn()), "jpg");
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
        expectImage(await renderSocialCard({ ...data, cover }, paths, vi.fn()), "jpg");
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
        expectImage(await renderSocialCard({ ...data, cover }, paths, warn), "jpg");
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("回退标题卡片"));
    });

    it("rejects an oversized local cover before decoding it", async () => {
        const file = path.join(paths.publicDir, "oversized.png");
        await copyFile(new URL("../public/avatar.png", import.meta.url), file);
        await truncate(file, 8 * 1024 * 1024 + 1);
        const warn = vi.fn();
        expectImage(
            await renderSocialCard({ ...data, cover: "/oversized.png" }, paths, warn),
            "jpg",
        );
        expect(warn).toHaveBeenCalledOnce();
    });

    it("propagates a font read failure when there is no artwork to remove", async () => {
        await expect(
            renderSocialCard(data, { ...paths, fontPath: path.join(root, "missing.ttf") }, vi.fn()),
        ).rejects.toThrow();
    });
});
