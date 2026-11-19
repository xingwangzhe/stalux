import path from "node:path";
import type { HtmlImage } from "./html-images";

/** Public directory holding the generated covers, relative to the build output. */
export const COVER_DIR = "stalux-covers";

// Post cards render at 640x360 and are shown on 2x screens, so 1280 is the
// widest useful source. Bigger originals only cost bytes.
const MAX_WIDTH = 1280;
const QUALITY = 82;
// Bump when any encoder input above changes, so cached files are not reused.
const RECIPE = "v1";

/** Formats worth re-encoding. Vector and icon sources stay untouched. */
const CONVERTIBLE = /\.(?:png|jpe?g|avif|tiff?|bmp|webp)$/iu;
const WEBP_CARD_WIDTH = 768;
const WEBP_CARD_QUALITY = 78;
const WEBP_MIN_BYTES = 48 * 1024;

interface SharpPipeline {
    metadata(): Promise<{ width?: number; pages?: number }>;
    resize(options: Record<string, unknown>): SharpPipeline;
    webp(options: Record<string, unknown>): SharpPipeline;
    toBuffer(): Promise<Buffer>;
}
type SharpFactory = (input: Buffer) => SharpPipeline;

/**
 * `sharp` ships as a dependency of Astro itself and as a dev dependency of the
 * theme, so it is present in practice — but it must never become a hard
 * requirement, because a project using another image service would otherwise
 * fail to build at all. Loaded through `require` because the Vite module runner
 * is already closed by the time `astro:build:done` runs.
 */
export function loadCoverEncoder(
    require: (id: string) => unknown,
    logger?: { warn: (message: string) => void },
): SharpFactory | undefined {
    try {
        const loaded = require("sharp") as { default?: unknown };
        const factory = (loaded?.default ?? loaded) as unknown;
        return typeof factory === "function" ? (factory as SharpFactory) : undefined;
    } catch {
        logger?.warn("封面转 WebP 已跳过：未找到 sharp，卡片继续使用原图");
        return undefined;
    }
}

export interface CoverContext {
    outDir: string;
    cacheDir: string;
    sharp: SharpFactory;
    conversions?: Map<string, Promise<string | undefined>>;
    /** Source files this page depends on, so editing a cover invalidates it. */
    dependencies?: Set<string>;
    logger?: { warn: (message: string) => void };
}

const digest = (parts: readonly (string | Buffer | Uint8Array)[]): string => {
    const hash = new Bun.CryptoHasher("sha256");
    for (const part of parts) hash.update(part).update("\0");
    return hash.digest("hex");
};

/**
 * Rewrites a marked card cover to a generated WebP.
 *
 * The name is content-addressed, so an unchanged cover keeps the same URL across
 * builds and stays cacheable at the CDN, while an edited one gets a new name
 * instead of a stale hit. The encoded file is kept in a cache directory outside
 * the build output; `restoreCoverFiles` copies those back in at the end of every
 * build, which is what keeps them present when a page was served from the
 * page-output cache and this per-page pass never ran for it.
 */
export async function upgradeCoverImages(
    images: readonly HtmlImage[],
    context: CoverContext,
): Promise<number> {
    const root = path.resolve(context.outDir);
    const cacheDir = path.join(context.cacheDir, RECIPE);
    let converted = 0;
    for (const image of images) {
        if (!image.attributes.has("data-stalux-cover")) continue;
        const src = image.attributes.get("src");
        if (!src?.startsWith("/") || src.startsWith("//")) continue;
        let pathname: string;
        try {
            pathname = decodeURIComponent(new URL(src, "https://stalux.invalid").pathname);
        } catch {
            continue;
        }
        if (!CONVERTIBLE.test(pathname)) continue;
        const source = path.resolve(root, `.${pathname}`);
        if (!source.startsWith(`${root}${path.sep}`)) continue;
        context.dependencies?.add(source);
        let conversion = context.conversions?.get(source);
        if (!conversion) {
            conversion = encodeCover(source, pathname, cacheDir, context);
            context.conversions?.set(source, conversion);
        }
        const filename = await conversion;
        if (!filename) continue;
        const attribute = image.node.attrs.find((entry) => entry.name === "src");
        if (!attribute) continue;
        attribute.value = `/${COVER_DIR}/${filename}`;
        converted++;
    }
    return converted;
}

async function encodeCover(
    source: string,
    pathname: string,
    cacheDir: string,
    context: CoverContext,
): Promise<string | undefined> {
    const webp = /\.webp$/iu.test(pathname);
    const input = Bun.file(source);
    if (!(await input.exists())) return;
    if (webp && input.size < WEBP_MIN_BYTES) return;

    let bytes: Buffer;
    try {
        bytes = Buffer.from(await input.bytes());
    } catch {
        return;
    }
    const width = webp ? WEBP_CARD_WIDTH : MAX_WIDTH;
    const quality = webp ? WEBP_CARD_QUALITY : QUALITY;
    const hash = digest([RECIPE, "webp", String(width), String(quality), bytes]);
    const filename = `${hash.slice(0, 16)}.webp`;
    const cached = path.join(cacheDir, filename);
    if (!(await Bun.file(cached).exists())) {
        try {
            const pipeline = context.sharp(bytes);
            if (webp) {
                const metadata = await pipeline.metadata();
                if ((metadata.width ?? 0) <= width || (metadata.pages ?? 1) > 1) return;
            }
            const encoded = await pipeline
                .resize({ width, withoutEnlargement: true })
                .webp({ quality, effort: 5 })
                .toBuffer();
            if (webp && encoded.length >= bytes.length) return;
            await Bun.write(cached, encoded);
        } catch (error) {
            // One malformed source must not fail the page it appears on.
            context.logger?.warn(`封面转 WebP 失败（${pathname}）：${String(error)}`);
            return;
        }
    }
    return filename;
}

/** Copy every cached cover into the build output so cached pages still resolve. */
export async function restoreCoverFiles(context: {
    outDir: string;
    cacheDir: string;
}): Promise<number> {
    const cacheDir = path.join(context.cacheDir, RECIPE);
    let names: string[];
    try {
        names = [...new Bun.Glob("*.webp").scanSync({ cwd: cacheDir, onlyFiles: true })];
    } catch {
        return 0;
    }
    const target = path.join(context.outDir, COVER_DIR);
    await Promise.all(
        names.map((name) =>
            Bun.write(path.join(target, name), Bun.file(path.join(cacheDir, name))),
        ),
    );
    return names.length;
}
