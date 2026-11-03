import path from "node:path";
import { Renderer } from "@takumi-rs/core";
import { type SocialCardData, socialCardFormat } from "../utils/social-image";
import { loadCover, type SocialCardPaths } from "./social-card-cover";
import { CARD_FONT_FAMILY, CARD_HEIGHT, CARD_WIDTH, socialCardTree } from "./social-card-layout";

export type { SocialCardPaths } from "./social-card-cover";
export { localCoverPath } from "./social-card-cover";
export { socialCardTree } from "./social-card-layout";

/** Bump when the layout or renderer changes so every cached render is replaced. */
const TEMPLATE = "stalux-mono-takumi-v2";
const JPEG_QUALITY = 60;

const renderers = new Map<string, Promise<Renderer>>();

function getRenderer(fontPath: string): Promise<Renderer> {
    let pending = renderers.get(fontPath);
    if (!pending) {
        pending = (async () => {
            const renderer = new Renderer({ cacheMaxBytes: 32 * 1024 * 1024 });
            await renderer.registerFont({
                name: CARD_FONT_FAMILY,
                data: await Bun.file(fontPath).bytes(),
            });
            return renderer;
        })();
        renderers.set(fontPath, pending);
    }
    return pending;
}

const fontDigests = new Map<string, Promise<string>>();
function getFontDigest(fontPath: string): Promise<string> {
    let pending = fontDigests.get(fontPath);
    if (!pending) {
        pending = Bun.file(fontPath)
            .bytes()
            .then((bytes) => new Bun.CryptoHasher("sha256").update(bytes).digest("hex"));
        fontDigests.set(fontPath, pending);
    }
    return pending;
}

export async function renderSocialCard(
    data: SocialCardData,
    paths: SocialCardPaths,
    warn: (message: string) => void,
): Promise<Buffer> {
    const format = socialCardFormat(data);
    let coverBytes: Buffer | undefined;
    if (data.cover) {
        try {
            coverBytes = await loadCover(data.cover, paths);
        } catch {
            warn(`分享封面不可用，已回退标题卡片：${data.title}`);
        }
    }
    // Content-only key: identical card data + identical font + identical cover
    // always reuses the cached render, whatever the filesystem timestamps say.
    // It is checked before any raster work, so a warm build only reads bytes.
    const fontDigest = await getFontDigest(paths.fontPath);
    const key = new Bun.CryptoHasher("sha256")
        .update(JSON.stringify([TEMPLATE, format, data, fontDigest]))
        .update(coverBytes ?? "")
        .digest("hex");
    const cacheFile = path.join(paths.cacheDir, `${key}.${format}`);
    const cached = Bun.file(cacheFile);
    if (cached.size > 0) return Buffer.from(await cached.bytes());

    const renderer = await getRenderer(paths.fontPath);
    const render = (withCover: boolean) =>
        renderer.render(socialCardTree(data, withCover), {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            format: format === "jpg" ? "jpeg" : "png",
            quality: JPEG_QUALITY,
            images: withCover && coverBytes ? [{ src: "stalux-cover", data: coverBytes }] : [],
        });
    let bytes: Buffer;
    let cacheable = true;
    try {
        bytes = await render(Boolean(coverBytes));
    } catch (error) {
        if (!coverBytes) throw error;
        warn(`分享封面解码失败，已回退标题卡片：${data.title}`);
        // Do not cache the fallback under the artwork key: a later build should
        // retry the cover instead of inheriting a short-lived decode failure.
        bytes = await render(false);
        cacheable = false;
    }
    if (!cacheable) return bytes;
    await Bun.write(cacheFile, bytes);
    return bytes;
}
