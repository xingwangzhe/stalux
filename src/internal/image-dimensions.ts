import { open } from "node:fs/promises";
import path from "node:path";
import { imageSize } from "image-size";
import { imageSizeFromFile } from "image-size/fromFile";
import { findHtmlImages, type HtmlImage, imageLoadingUpdates, updateImageTag } from "./html-images";

export type ImageDimensions = { width: number; height: number };

/** Preserve JPEG layouts the library cannot recognize, including a leading SOF marker. */
function readJpegDimensions(data: Buffer): ImageDimensions | undefined {
    if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return undefined;
    let offset = 2;
    while (offset + 4 <= data.length) {
        if (data[offset] !== 0xff) return undefined;
        const marker = data[offset + 1] ?? 0;
        const size = data.readUInt16BE(offset + 2);
        if (size < 2 || offset + 2 + size > data.length) return undefined;
        if (
            [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
                marker,
            )
        ) {
            if (size < 7) return undefined;
            return validDimensions({
                width: data.readUInt16BE(offset + 7),
                height: data.readUInt16BE(offset + 5),
            });
        }
        offset += size + 2;
    }
    return undefined;
}

function validDimensions(size: ImageDimensions): ImageDimensions | undefined {
    return Number.isFinite(size.width) &&
        Number.isFinite(size.height) &&
        size.width > 0 &&
        size.height > 0
        ? { width: size.width, height: size.height }
        : undefined;
}

/** Unsupported or malformed images leave the original HTML untouched. */
export function readImageDimensions(data: Buffer): ImageDimensions | undefined {
    try {
        return validDimensions(imageSize(data));
    } catch {
        return readJpegDimensions(data);
    }
}

async function readLocalImageDimensions(filename: string): Promise<ImageDimensions | undefined> {
    try {
        // image-size reads at most 512 KiB; the caller retains the four-page work queue.
        return validDimensions(await imageSizeFromFile(filename));
    } catch {
        // Preserve previously supported JPEGs whose SOF is first or beyond the header window.
        // Only this compatibility path reads a whole image, never an unknown or remote format.
        const file = await open(filename, "r").catch(() => undefined);
        if (!file) return undefined;
        try {
            const signature = Buffer.alloc(2);
            await file.read(signature, 0, 2, 0);
            if (signature[0] !== 0xff || signature[1] !== 0xd8) return undefined;
            return readImageDimensions(await file.readFile());
        } catch {
            return undefined;
        } finally {
            await file.close();
        }
    }
}

/** Add width/height to same-origin emitted images so their space is reserved before download. */
async function resolveImageUpdates(
    images: HtmlImage[],
    outputDir: string,
    options: {
        cache?: Map<string, Promise<ImageDimensions | undefined>>;
        loadingPolicy?: boolean;
        dependencies?: Set<string>;
    } = {},
): Promise<Map<HtmlImage, Record<string, string>>> {
    const dimensionsCache =
        options.cache ?? new Map<string, Promise<ImageDimensions | undefined>>();
    const root = path.resolve(outputDir);
    const loading = options.loadingPolicy ? imageLoadingUpdates(images) : new Map();
    const changes = new Map<HtmlImage, Record<string, string>>();
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
                    dimensions = readLocalImageDimensions(filePath).catch(() => undefined);
                    dimensionsCache.set(filePath, dimensions);
                }
                const size = await dimensions;
                if (size && size.width > 0 && size.height > 0) {
                    if (!image.attributes.has("width")) updates.width = String(size.width);
                    if (!image.attributes.has("height")) updates.height = String(size.height);
                }
            }
        }
        if (Object.keys(updates).length) changes.set(image, updates);
    }
    return changes;
}

/** Mutate image attributes in the shared build AST; the caller serializes once. */
export async function updateLocalImageDimensions(
    images: HtmlImage[],
    outputDir: string,
    options: Parameters<typeof resolveImageUpdates>[2] = {},
): Promise<void> {
    const changes = await resolveImageUpdates(images, outputDir, options);
    for (const [image, updates] of changes) {
        for (const [name, value] of Object.entries(updates)) {
            const attribute = image.node.attrs.find((attribute) => attribute.name === name);
            if (attribute) attribute.value = value;
            else image.node.attrs.push({ name, value });
        }
    }
}

/** Compatibility string API; the production pipeline uses AST mutations above. */
export async function addLocalImageDimensions(
    html: string,
    outputDir: string,
    options: Parameters<typeof resolveImageUpdates>[2] & { images?: HtmlImage[] } = {},
): Promise<string> {
    const changes = await resolveImageUpdates(
        options.images ?? findHtmlImages(html),
        outputDir,
        options,
    );
    const replacements = [...changes].map(([image, updates]) => ({
        start: image.start,
        end: image.end,
        tag: updateImageTag(image, updates),
    }));
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
