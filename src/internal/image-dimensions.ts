import { readFile } from "node:fs/promises";
import path from "node:path";
import { findHtmlImages, type HtmlImage, imageLoadingUpdates, updateImageTag } from "./html-images";

export type ImageDimensions = { width: number; height: number };

/** Read intrinsic dimensions for common public image formats without loading an image library. */
export function readImageDimensions(data: Buffer): ImageDimensions | undefined {
    if (data.length >= 24 && data.toString("hex", 0, 8) === "89504e470d0a1a0a") {
        return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
    }

    if (
        data.length >= 10 &&
        (data.toString("ascii", 0, 6) === "GIF87a" || data.toString("ascii", 0, 6) === "GIF89a")
    ) {
        return { width: data.readUInt16LE(6), height: data.readUInt16LE(8) };
    }

    if (
        data.length >= 30 &&
        data.toString("ascii", 0, 4) === "RIFF" &&
        data.toString("ascii", 8, 12) === "WEBP"
    ) {
        const chunk = data.toString("ascii", 12, 16);
        if (chunk === "VP8X") {
            return {
                width: 1 + data.readUIntLE(24, 3),
                height: 1 + data.readUIntLE(27, 3),
            };
        }
        if (chunk === "VP8 " && data[23] === 0x9d && data[24] === 0x01 && data[25] === 0x2a) {
            return {
                width: data.readUInt16LE(26) & 0x3fff,
                height: data.readUInt16LE(28) & 0x3fff,
            };
        }
        if (chunk === "VP8L" && data[20] === 0x2f) {
            const b1 = data[21] ?? 0;
            const b2 = data[22] ?? 0;
            const b3 = data[23] ?? 0;
            const b4 = data[24] ?? 0;
            return {
                width: 1 + b1 + ((b2 & 0x3f) << 8),
                height: 1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10),
            };
        }
    }

    if (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8) {
        let offset = 2;
        while (offset + 4 <= data.length) {
            if (data[offset] !== 0xff) break;
            const marker = data[offset + 1] ?? 0;
            const size = data.readUInt16BE(offset + 2);
            if (size < 7 || offset + 2 + size > data.length) break;
            if (
                [
                    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
                ].includes(marker)
            ) {
                return {
                    width: data.readUInt16BE(offset + 7),
                    height: data.readUInt16BE(offset + 5),
                };
            }
            offset += size + 2;
        }
    }

    return undefined;
}

/** Add width/height to same-origin emitted images so their space is reserved before download. */
export async function addLocalImageDimensions(
    html: string,
    outputDir: string,
    options: {
        images?: HtmlImage[];
        cache?: Map<string, Promise<ImageDimensions | undefined>>;
        loadingPolicy?: boolean;
        dependencies?: Set<string>;
    } = {},
): Promise<string> {
    const dimensionsCache =
        options.cache ?? new Map<string, Promise<ImageDimensions | undefined>>();
    const root = path.resolve(outputDir);
    const images = options.images ?? findHtmlImages(html);
    const loading = options.loadingPolicy ? imageLoadingUpdates(images) : new Map();
    const replacements: Array<{ start: number; end: number; tag: string }> = [];
    for (const image of images) {
        const updates: Record<string, string> = { ...loading.get(image) };
        const src = image.attributes.get("src");
        if (src && !(image.attributes.has("width") && image.attributes.has("height"))) {
            let filePath: string | undefined;
            try {
                const url = new URL(src, "https://stalux.invalid");
                if (url.origin === "https://stalux.invalid") {
                    const candidate = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
                    if (candidate === root || candidate.startsWith(`${root}${path.sep}`))
                        filePath = candidate;
                }
            } catch {
                // Invalid image URLs still receive the loading policy.
            }
            if (filePath) {
                options.dependencies?.add(filePath);
                let dimensions = dimensionsCache.get(filePath);
                if (!dimensions) {
                    dimensions = readFile(filePath)
                        .then(readImageDimensions)
                        .catch(() => undefined);
                    dimensionsCache.set(filePath, dimensions);
                }
                const size = await dimensions;
                if (size && size.width > 0 && size.height > 0) {
                    if (!image.attributes.has("width")) updates.width = String(size.width);
                    if (!image.attributes.has("height")) updates.height = String(size.height);
                }
            }
        }
        if (Object.keys(updates).length) {
            replacements.push({
                start: image.start,
                end: image.end,
                tag: updateImageTag(image, updates),
            });
        }
    }
    if (!replacements.length) return html;
    const parts: string[] = [];
    let offset = 0;
    for (const replacement of replacements) {
        parts.push(html.slice(offset, replacement.start), replacement.tag);
        offset = replacement.end;
    }
    parts.push(html.slice(offset));
    return parts.join("");
}
