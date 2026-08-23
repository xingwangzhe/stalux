/**
 * Build-time CJK font slicing engine (Astro Fonts API variant).
 *
 * Slices the full-size LXGW WenKai font (25 MB TTF) into ~20 woff2 chunks
 * by unicode-range, registered through the official `fontProviders.local()`
 * pipeline (`updateConfig({ fonts })`). The browser downloads only the chunks
 * whose unicode-range matches characters on the page.
 *
 * Astro's local provider reads font files from disk (`readFile`), so no
 * network access is involved at build time — identical behavior on GitHub
 * Actions and CN mirrors. Slices are emitted to `node_modules/.astro/`
 * (the Astro cacheDir) so they stay out of the repo and out of `dist/fonts`.
 *
 * Output layout:
 *   node_modules/.astro/stalux-fonts/
 *     lxgw-wenkai-slice-{n}-{hash}.woff2   — unicode-range chunk (content-addressed)
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegrationLogger } from "astro";
import subsetFont from "subset-font";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Full font input path (relative to project root or package) */
const FONT_INPUT = "src/assets/fonts/LXGWWenKai-Regular.ttf";

/** Code font input paths (variable fonts, registered as-is, no slicing) */
const CODE_FONT_INPUT = "src/assets/fonts/GoogleSansCode.woff2";
const CODE_FONT_ITALIC_INPUT = "src/assets/fonts/GoogleSansCode-Italic.woff2";

/** Output directory for generated slices (under the Astro cacheDir) */
const SLICE_OUT_DIR = "node_modules/.astro/stalux-fonts";

/** Chunk size (code points) for the CJK Unified Ideographs block */
const CJK_CHUNK_SIZE = 1050;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FontSlice {
    /** Absolute path to the generated woff2 file */
    src: string;
    /** Unicode ranges for the @font-face unicode-range descriptor */
    unicodeRange: string[];
}

export interface SlicedFonts {
    /** Body font slices (LXGW WenKai), one variant per chunk */
    body: FontSlice[];
    /** Absolute path to the code font woff2 */
    codeNormal: string;
    /** Absolute path to the code italic woff2, if present */
    codeItalic?: string;
}

interface SliceDef {
    /** Ordinal used in the output filename */
    id: number;
    /** [start, end] code-point ranges covered by this slice */
    ranges: Array<[number, number]>;
}

// ---------------------------------------------------------------------------
// Slice definitions
// ---------------------------------------------------------------------------

/**
 * CJK Unified Ideographs (U+4E00–U+9FFF) split into fixed-size chunks.
 * Chunk boundaries are content-independent, so slices are deterministic
 * across builds (no per-page character scanning).
 */
function buildCjkChunks(start = 0x4e00, end = 0x9fff, size = CJK_CHUNK_SIZE): SliceDef[] {
    const chunks: SliceDef[] = [];
    for (let s = start, id = 2; s <= end; s += size, id++) {
        chunks.push({ id, ranges: [[s, Math.min(s + size - 1, end)]] });
    }
    return chunks;
}

const SLICES: SliceDef[] = [
    // ASCII printable + Latin-1 supplement
    { id: 0, ranges: [[0x20, 0x7e]] },
    // CJK punctuation / fullwidth forms / general punctuation
    {
        id: 1,
        ranges: [
            [0x2000, 0x206f],
            [0x3000, 0x303f],
            [0xff00, 0xffef],
        ],
    },
    ...buildCjkChunks(),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Locate a font file: project root → stalux package → this package. */
function findFont(projectRoot: string, rel: string): string | undefined {
    const candidates = [
        resolve(projectRoot, rel),
        resolve(projectRoot, "node_modules", "@xingwangzhe", "stalux", rel),
        resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", rel),
    ];
    return candidates.find((p) => existsSync(p));
}

/** Render a [start, end] range as a CSS unicode-range value. */
export function toUnicodeRange(ranges: Array<[number, number]>): string[] {
    const hex = (codePoint: number) => codePoint.toString(16).toUpperCase().padStart(4, "0");
    return ranges.map(([start, end]) =>
        start === end ? `U+${hex(start)}` : `U+${hex(start)}-${hex(end)}`,
    );
}

/** Collect every code point in the ranges as a deduped, sorted string. */
function rangesToChars(ranges: Array<[number, number]>): string {
    const set = new Set<string>();
    for (const [s, e] of ranges) {
        for (let cp = s; cp <= e; cp++) {
            set.add(String.fromCodePoint(cp));
        }
    }
    return [...set].sort().join("");
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Slice the body font into unicode-range woff2 chunks and resolve the code
 * fonts, all from local disk. Returns `null` when the body font is missing so
 * the caller can skip font injection (pages fall back to system fonts).
 *
 * Called from the `astro:config:setup` hook before `updateConfig({ fonts })`.
 */
export async function runFontSlicing(
    projectRoot: string,
    logger: AstroIntegrationLogger,
): Promise<SlicedFonts | null> {
    // 1. Locate fonts (check project root first, then stalux package dir)
    const fontPath = findFont(projectRoot, FONT_INPUT);
    if (!fontPath) {
        logger.warn(`Body font not found at ${FONT_INPUT}, skipping font injection`);
        return null;
    }
    const codeNormal = findFont(projectRoot, CODE_FONT_INPUT);
    if (!codeNormal) {
        logger.warn(`Code font not found at ${CODE_FONT_INPUT}, skipping font injection`);
        return null;
    }
    const codeItalic = findFont(projectRoot, CODE_FONT_ITALIC_INPUT);

    const fontBuffer = readFileSync(fontPath);
    const outDir = resolve(projectRoot, SLICE_OUT_DIR);
    mkdirSync(outDir, { recursive: true });

    // 2. Slice the body font into unicode-range chunks.
    // Filename is content-addressed (md5 of the character set): identical
    // input chars → identical bytes → identical name across builds, keeping
    // the incremental-build dependency graph stable.
    const body: FontSlice[] = [];
    for (const def of SLICES) {
        const chars = rangesToChars(def.ranges);
        if (!chars) continue;
        const hash = createHash("md5").update(chars).digest("hex").slice(0, 12);
        const filename = `lxgw-wenkai-slice-${def.id}-${hash}.woff2`;
        const outPath = join(outDir, filename);

        if (!existsSync(outPath)) {
            try {
                const data = await subsetFont(fontBuffer, chars, { targetFormat: "woff2" });
                if (data.length > 0) {
                    writeFileSync(outPath, data);
                    logger.debug(
                        `  body slice ${def.id}: ${(data.length / 1024).toFixed(1)} KB → ${filename}`,
                    );
                }
            } catch (error) {
                logger.warn(`  body slice ${def.id} failed: ${String(error)}`);
            }
        }

        if (existsSync(outPath)) {
            body.push({ src: outPath, unicodeRange: toUnicodeRange(def.ranges) });
        }
    }

    if (body.length === 0) {
        logger.warn("Body font slicing produced no chunks, skipping font injection");
        return null;
    }

    logger.info(
        `Font slicing done: ${body.length} body chunks + code font ` +
            `(source ${(fontBuffer.length / 1024 / 1024).toFixed(1)} MB → woff2 chunks)`,
    );
    return { body, codeNormal, codeItalic };
}
