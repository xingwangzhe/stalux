import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { type Node, Renderer } from "@takumi-rs/core";
import { imageSize } from "image-size";
import type { SocialCardData } from "../utils/social-image";

export interface SocialCardPaths {
    publicDir: string;
    cacheDir: string;
    base: string;
    fontPath: string;
}

const MAX_COVER_BYTES = 8 * 1024 * 1024;
let rendererPromise: Promise<Renderer> | undefined;
function getRenderer(fontPath: string): Promise<Renderer> {
    rendererPromise ??= (async () => {
        const renderer = new Renderer({ cacheMaxBytes: 32 * 1024 * 1024 });
        await renderer.registerFont({ name: "Stalux Card", data: await readFile(fontPath) });
        return renderer;
    })();
    return rendererPromise;
}

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

async function loadCover(cover: string, paths: SocialCardPaths): Promise<Buffer> {
    const key = `${paths.publicDir}|${cover}`;
    let pending = coverRequests.get(key);
    if (!pending) {
        pending = loadCoverUncached(cover, paths);
        coverRequests.set(key, pending);
        // Bound memory while sharing requests and failures between WebP and PNG renders.
        if (coverRequests.size > 8) coverRequests.delete(coverRequests.keys().next().value ?? "");
    }
    return pending;
}

async function loadCoverUncached(cover: string, paths: SocialCardPaths): Promise<Buffer> {
    const local = localCoverPath(cover, paths);
    let bytes: Buffer;
    if (local) {
        if ((await stat(local)).size > MAX_COVER_BYTES) throw new Error("cover exceeds 8 MiB");
        bytes = await readFile(local);
    } else {
        const url = new URL(cover.startsWith("//") ? `https:${cover}` : cover);
        if (!["https:", "http:"].includes(url.protocol)) throw new Error("invalid cover URL");
        const remoteCache = path.join(
            paths.cacheDir,
            "covers",
            createHash("sha256").update(url.href).digest("hex"),
        );
        const cachedStat = await stat(remoteCache).catch(() => undefined);
        if (cachedStat && Date.now() - cachedStat.mtimeMs < 86_400_000)
            return readFile(remoteCache);
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok || !response.headers.get("content-type")?.startsWith("image/"))
            throw new Error(`cover returned HTTP ${response.status} or non-image content`);
        const chunks: Uint8Array[] = [];
        let size = 0;
        if (!response.body) throw new Error("empty cover");
        for await (const chunk of response.body) {
            size += chunk.length;
            if (size > MAX_COVER_BYTES) throw new Error("cover exceeds 8 MiB");
            chunks.push(chunk);
        }
        bytes = Buffer.concat(chunks);
        const dimensions = imageSize(bytes);
        if (
            !dimensions.width ||
            !dimensions.height ||
            dimensions.width * dimensions.height > 32_000_000
        )
            throw new Error("invalid cover dimensions");
        await mkdir(path.dirname(remoteCache), { recursive: true });
        await writeFile(remoteCache, bytes);
    }
    const dimensions = imageSize(bytes);
    if (
        !dimensions.width ||
        !dimensions.height ||
        dimensions.width * dimensions.height > 32_000_000
    )
        throw new Error("invalid or oversized cover dimensions");
    return bytes;
}

function text(value: string, style: Node["style"]): Node {
    return { type: "text", text: value, style };
}

/** A fixed editorial layout: site identity, readable title, optional artwork, quiet footer. */
export function socialCardTree(
    data: SocialCardData,
    hasCover: boolean,
    titleSize = 60,
    title = data.title,
): Node {
    const titleWidth = hasCover ? 650 : 1056;
    const accent = /^#[\da-f]{6}$/iu.test(data.accent) ? data.accent : "#EAB308";
    const children: Node[] = [
        {
            type: "container",
            style: {
                position: "absolute",
                right: -120,
                top: -200,
                width: 650,
                height: 650,
                borderRadius: "50%",
                border: `1px solid ${accent}35`,
                background: `radial-gradient(circle, ${accent}18, transparent 70%)`,
            },
        },
        {
            type: "container",
            style: {
                position: "absolute",
                left: 0,
                top: 0,
                width: 1200,
                height: 6,
                backgroundColor: accent,
            },
        },
        text(data.siteTitle, {
            position: "absolute",
            left: 72,
            top: 48,
            width: 820,
            height: 46,
            fontSize: 28,
            color: accent,
            overflow: "hidden",
        }),
        text(data.category || "ARTICLE", {
            position: "absolute",
            right: 72,
            top: 54,
            width: 240,
            height: 36,
            textAlign: "right",
            fontSize: 21,
            color: "#a9b5c6",
            overflow: "hidden",
        }),
        text(title, {
            position: "absolute",
            left: 72,
            top: 142,
            width: titleWidth,
            height: 260,
            fontSize: titleSize,
            lineHeight: 1.24,
            color: "#f5f7fb",
            overflow: "hidden",
            overflowWrap: "anywhere",
        }),
        text([...data.description.replace(/\s+/gu, " ")].slice(0, hasCover ? 65 : 100).join(""), {
            position: "absolute",
            left: 72,
            top: 421,
            width: titleWidth,
            height: 76,
            fontSize: 25,
            lineHeight: 1.45,
            color: "#a9b5c6",
            overflow: "hidden",
        }),
        {
            type: "container",
            style: {
                position: "absolute",
                left: 72,
                top: 535,
                width: 1056,
                height: 1,
                backgroundColor: "#ffffff22",
            },
        },
        text(data.host, { position: "absolute", left: 72, top: 560, fontSize: 23, color: accent }),
        text(`${data.author}  /  ${data.date}`, {
            position: "absolute",
            right: 72,
            top: 560,
            width: 650,
            textAlign: "right",
            fontSize: 23,
            color: "#b9c4d3",
        }),
    ];
    if (hasCover)
        children.push({
            type: "image",
            src: "stalux-cover",
            style: {
                position: "absolute",
                right: 72,
                top: 142,
                width: 350,
                height: 354,
                objectFit: "cover",
                borderRadius: 20,
            },
        });
    return {
        type: "container",
        lang: data.lang,
        style: {
            width: 1200,
            height: 630,
            position: "relative",
            backgroundColor: "#101722",
            fontFamily: "Stalux Card",
            overflow: "hidden",
        },
        children,
    };
}

export async function renderSocialCard(
    data: SocialCardData,
    paths: SocialCardPaths,
    warn: (message: string) => void,
    format: "webp" | "png" = "webp",
): Promise<Buffer> {
    let cover: Buffer | undefined;
    if (data.cover) {
        try {
            cover = await loadCover(data.cover, paths);
        } catch {
            warn(`分享封面不可用，已回退标题卡片：${data.title}`);
        }
    }
    const font = await stat(paths.fontPath);
    const key = createHash("sha256")
        .update(JSON.stringify(["v2", format, data, font.size, font.mtimeMs]))
        .update(cover ?? "")
        .digest("hex");
    const cacheFile = path.join(paths.cacheDir, `${key}.${format}`);
    const hit = await readFile(cacheFile).catch(() => undefined);
    if (hit) return hit;
    const renderer = await getRenderer(paths.fontPath);
    const layout = async (withCover: boolean) => {
        const width = withCover ? 650 : 1056;
        let title = [...data.title].slice(0, 150).join("");
        let size = 66;
        while (true) {
            const measured = await renderer.measure(
                {
                    type: "text",
                    text: title,
                    style: {
                        width,
                        fontSize: size,
                        lineHeight: 1.24,
                        fontFamily: "Stalux Card",
                        overflowWrap: "anywhere",
                    },
                },
                { width },
            );
            if (measured.height <= 250) break;
            if (size > 30) size -= 2;
            else title = `${[...title].slice(0, -3).join("")}…`;
        }
        return socialCardTree(data, withCover, size, title);
    };
    let bytes: Buffer;
    try {
        bytes = await renderer.render(await layout(Boolean(cover)), {
            width: 1200,
            height: 630,
            format,
            quality: 86,
            images: cover ? [{ src: "stalux-cover", data: cover }] : [],
        });
    } catch (error) {
        if (!cover) throw error;
        warn(`分享封面解码失败，已回退标题卡片：${data.title}`);
        bytes = await renderer.render(await layout(false), {
            width: 1200,
            height: 630,
            format,
            quality: 86,
        });
    }
    await mkdir(paths.cacheDir, { recursive: true });
    await writeFile(cacheFile, bytes);
    return bytes;
}
