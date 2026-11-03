import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageSize } from "image-size";
import { loadSharp, type SharpRawBuffer } from "./sharp-loader";
import { CARD_HEIGHT, COVER_WIDTH } from "./social-card-layout";

export interface SocialCardPaths {
    publicDir: string;
    cacheDir: string;
    base: string;
    fontPath: string;
}

const MAX_COVER_BYTES = 8 * 1024 * 1024;
const COVER_CACHE_TTL_MS = 86_400_000;

/** Resolve only assets inside the final public directory, including encoded Chinese paths. */
export function localCoverPath(cover: string, paths: SocialCardPaths): string | undefined {
    if (!cover.startsWith("/") || cover.startsWith("//")) return undefined;
    try {
        let pathname = decodeURIComponent(cover.split(/[?#]/u)[0] ?? "");
        const base = paths.base.replace(/\/$/u, "");
        if (base && pathname.startsWith(`${base}/`)) pathname = pathname.slice(base.length);
        const target = path.resolve(paths.publicDir, `.${pathname}`);
        if (!target.startsWith(`${path.resolve(paths.publicDir)}${path.sep}`)) return undefined;
        return target;
    } catch {
        return undefined;
    }
}

const coverRequests = new Map<string, Promise<Buffer>>();

export function loadCover(cover: string, paths: SocialCardPaths): Promise<Buffer> {
    const key = `${paths.publicDir}|${cover}`;
    let pending = coverRequests.get(key);
    if (!pending) {
        pending = loadCoverUncached(cover, paths);
        coverRequests.set(key, pending);
        // Bound memory while sharing requests and failures between renders.
        if (coverRequests.size > 8) coverRequests.delete(coverRequests.keys().next().value ?? "");
    }
    return pending;
}

function assertDimensions(bytes: Buffer): void {
    const dimensions = imageSize(bytes);
    if (
        !(dimensions.width && dimensions.height) ||
        dimensions.width * dimensions.height > 32_000_000
    )
        throw new Error("invalid or oversized cover dimensions");
}

async function readLocalCover(local: string): Promise<Buffer> {
    if ((await stat(local)).size > MAX_COVER_BYTES) throw new Error("cover exceeds 8 MiB");
    const bytes = await readFile(local);
    assertDimensions(bytes);
    return bytes;
}

async function readResponseBytes(response: Response): Promise<Buffer> {
    if (!response.body) throw new Error("empty cover");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of response.body) {
        size += chunk.length;
        if (size > MAX_COVER_BYTES) throw new Error("cover exceeds 8 MiB");
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

async function fetchCover(url: URL, cacheFile: string): Promise<Buffer> {
    const cachedStat = await stat(cacheFile).catch(() => undefined);
    if (cachedStat && Date.now() - cachedStat.mtimeMs < COVER_CACHE_TTL_MS)
        return readFile(cacheFile);
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!(response.ok && response.headers.get("content-type")?.startsWith("image/")))
        throw new Error(`cover returned HTTP ${response.status} or non-image content`);
    const bytes = await readResponseBytes(response);
    assertDimensions(bytes);
    await mkdir(path.dirname(cacheFile), { recursive: true });
    await writeFile(cacheFile, bytes);
    return bytes;
}

function loadCoverUncached(cover: string, paths: SocialCardPaths): Promise<Buffer> {
    const local = localCoverPath(cover, paths);
    if (local) return readLocalCover(local);
    const url = new URL(cover.startsWith("//") ? `https:${cover}` : cover);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("invalid cover URL");
    return fetchCover(
        url,
        path.join(paths.cacheDir, "covers", createHash("sha256").update(url.href).digest("hex")),
    );
}

const preparedCovers = new Map<string, Promise<SharpRawBuffer>>();

/**
 * Crop, flatten and downscale the artwork to the exact panel size. The pixels
 * are composited after rasterization instead of being embedded in the SVG: an
 * image inside the SVG made Resvg decode and scale it as part of vector
 * rasterization, which cost several hundred milliseconds per card.
 */
export async function prepareCover(bytes: Buffer): Promise<SharpRawBuffer> {
    const sharp = loadSharp();
    if (!sharp) throw new Error("sharp is required to crop artwork");
    const digest = createHash("sha256").update(bytes).digest("hex");
    let pending = preparedCovers.get(digest);
    if (!pending) {
        pending = sharp(bytes)
            .rotate()
            .resize({
                width: COVER_WIDTH,
                height: CARD_HEIGHT,
                fit: "cover",
                position: "centre",
            })
            .flatten({ background: "#ffffff" })
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
        preparedCovers.set(digest, pending);
        if (preparedCovers.size > 16)
            preparedCovers.delete(preparedCovers.keys().next().value ?? "");
    }
    try {
        return await pending;
    } catch (error) {
        preparedCovers.delete(digest);
        throw new Error("cover could not be prepared", { cause: error });
    }
}

/** Only used when sharp is unavailable, so Satori can embed the original bytes. */
export function coverDataUri(bytes: Buffer): string {
    const { type } = imageSize(bytes);
    const mime = type === "jpg" ? "image/jpeg" : `image/${type ?? "png"}`;
    return `data:${mime};base64,${bytes.toString("base64")}`;
}
