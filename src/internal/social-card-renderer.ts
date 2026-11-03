import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { type SocialCardData, socialCardFormat } from "../utils/social-image";
import { loadSharp, type SharpPipeline, type SharpRawBuffer } from "./sharp-loader";
import { coverDataUri, loadCover, prepareCover, type SocialCardPaths } from "./social-card-cover";
import {
    CARD_FONT_FAMILY,
    CARD_FONT_WEIGHT,
    CARD_HEIGHT,
    CARD_WIDTH,
    COVER_LEFT,
    socialCardTree,
} from "./social-card-layout";

export type { SocialCardPaths } from "./social-card-cover";
export { localCoverPath } from "./social-card-cover";
export { socialCardTree } from "./social-card-layout";

/** Bump when the layout changes so every cached render is replaced. */
const TEMPLATE = "stalux-mono-v1";

type SatoriInput = Parameters<typeof satori>[0];

function encodeWithSharp(
    pipeline: SharpPipeline,
    format: "jpg" | "png",
    panel?: SharpRawBuffer,
): Promise<Buffer> {
    if (format === "jpg") {
        // The artwork keeps its colour. Without artwork the whole frame is
        // black and white, so the smaller true grayscale JPEG is used.
        const composed = panel
            ? pipeline.composite([
                  {
                      input: panel.data,
                      raw: {
                          width: panel.info.width,
                          height: panel.info.height,
                          channels: panel.info.channels,
                      },
                      left: COVER_LEFT,
                      top: 0,
                  },
              ])
            : pipeline.greyscale().toColourspace("b-w");
        return composed.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    }
    return pipeline
        .greyscale()
        .png({ compressionLevel: 9, palette: true, colours: 256, effort: 3 })
        .toBuffer();
}

/**
 * Rasterize with Resvg, then let Sharp compose and encode in a single pass.
 * System-font discovery is disabled because Satori already converted every
 * glyph to a path; leaving it on made each Resvg instance scan all installed
 * fonts, costing about 500ms per card.
 */
async function renderCardBytes(
    svg: string,
    format: "jpg" | "png",
    panel?: SharpRawBuffer,
): Promise<Buffer> {
    const png = new Resvg(svg, {
        fitTo: { mode: "width", value: CARD_WIDTH },
        background: "#ffffff",
        font: { loadSystemFonts: false },
    })
        .render()
        .asPng();
    const sharp = loadSharp();
    if (!sharp) {
        if (format === "jpg") throw new Error("JPEG encoding requires sharp");
        return png;
    }
    try {
        return await encodeWithSharp(sharp(png), format, panel);
    } catch (error) {
        if (format === "jpg") throw error;
        return png;
    }
}

const fonts = new Map<string, Promise<Buffer>>();
function readFont(fontPath: string): Promise<Buffer> {
    let pending = fonts.get(fontPath);
    if (!pending) {
        pending = readFile(fontPath);
        fonts.set(fontPath, pending);
    }
    return pending;
}

let fontDigestPromise: Promise<string> | undefined;
function getFontDigest(fontPath: string): Promise<string> {
    fontDigestPromise ??= readFile(fontPath).then((bytes) =>
        createHash("sha256").update(bytes).digest("hex"),
    );
    return fontDigestPromise;
}

export async function renderSocialCard(
    data: SocialCardData,
    paths: SocialCardPaths,
    warn: (message: string) => void,
): Promise<Buffer> {
    const format = socialCardFormat(data);
    const sharpAvailable = Boolean(loadSharp());
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
    // It is checked before cropping artwork so a warm build does no image work.
    const fontDigest = await getFontDigest(paths.fontPath);
    const key = createHash("sha256")
        .update(
            JSON.stringify([TEMPLATE, format, data, fontDigest, sharpAvailable ? "panel" : "flat"]),
        )
        .update(coverBytes ?? "")
        .digest("hex");
    const cacheFile = path.join(paths.cacheDir, `${key}.${format}`);
    const hit = await readFile(cacheFile).catch(() => undefined);
    if (hit) return hit;

    let panel: SharpRawBuffer | undefined;
    let inlineCover: string | undefined;
    if (coverBytes) {
        if (sharpAvailable) {
            try {
                panel = await prepareCover(coverBytes);
            } catch {
                warn(`分享封面不可用，已回退标题卡片：${data.title}`);
            }
        } else {
            // Without sharp there is no compositor, so the original bytes go
            // through Satori instead (PNG/JPEG only, and no palette encoding).
            inlineCover = coverDataUri(coverBytes);
        }
    }

    const withCover = Boolean(panel || inlineCover);
    const renderTree = async (hasCover: boolean) => {
        const svg = await satori(
            socialCardTree(
                data,
                hasCover,
                hasCover ? inlineCover : undefined,
            ) as unknown as SatoriInput,
            {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                fonts: [
                    {
                        name: CARD_FONT_FAMILY,
                        data: await readFont(paths.fontPath),
                        weight: CARD_FONT_WEIGHT,
                        style: "normal",
                    },
                ],
            },
        );
        return renderCardBytes(svg, format, hasCover ? panel : undefined);
    };
    let bytes: Buffer;
    try {
        bytes = await renderTree(withCover);
    } catch (error) {
        if (!withCover) throw error;
        warn(`分享封面解码失败，已回退标题卡片：${data.title}`);
        // Do not cache the fallback under the artwork key: a later build should
        // retry the cover instead of inheriting a short-lived decode failure.
        return renderTree(false);
    }
    await mkdir(paths.cacheDir, { recursive: true });
    await writeFile(cacheFile, bytes);
    return bytes;
}
