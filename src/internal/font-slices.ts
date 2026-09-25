/**
 * Build-time CJK font subsetting engine.
 *
 * LXGW WenKai is subset per rendered page with the native N-API package. Only
 * the independent Google Sans Code font uses Astro's local Fonts API.
 *
 * Astro's local provider reads font files from disk (`readFile`), so no
 * network access is involved at build time — identical behavior on GitHub
 * Actions and CN mirrors. Page subset cache is emitted to `node_modules/.astro/`
 * so it stays out of the repo and out of `dist/fonts`.
 *
 * Output layout:
 *   node_modules/.astro/stalux-page-fonts/
 *     page-{hash}.woff2   — page-specific content-addressed CJK subset
 */

import { existsSync, readdirSync, readFileSync, unlinkSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { subsetFont } from "@xingwangzhe/cjk-font-split-native";
import type { AstroIntegrationLogger } from "astro";
import { type DefaultTreeAdapterMap, parse } from "parse5";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Full font input path (relative to project root or package) */
const FONT_INPUT = "src/assets/fonts/LXGWWenKai-Regular.ttf";

/** Code font input paths (variable fonts, registered as-is, no slicing) */
const CODE_FONT_INPUT = "src/assets/fonts/GoogleSansCode.woff2";
const CODE_FONT_ITALIC_INPUT = "src/assets/fonts/GoogleSansCode-Italic.woff2";

const PAGE_SLICE_OUT_DIR = "node_modules/.astro/stalux-page-fonts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FontInputs {
    /** Build-time per-page subset cache, outside dist so incremental builds can reuse it. */
    pageSubsetDir: string;
    fontBuffer: Buffer;
    /** Absolute path to the code font woff2 */
    codeNormal: string;
    /** Absolute path to the code italic woff2, if present */
    codeItalic?: string;
}

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

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Resolve the body-font source for native page subsetting and code fonts for
 * Astro's local provider. Returns `null` when a required font is missing so
 * the caller can skip font injection (pages fall back to system fonts).
 *
 * Called from the `astro:config:setup` hook before `updateConfig({ fonts })`.
 */
export async function resolveFontInputs(
    projectRoot: string,
    logger: AstroIntegrationLogger,
): Promise<FontInputs | null> {
    const started = performance.now();
    logger.debug("locating font inputs");
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
    logger.debug(`font inputs located in ${(performance.now() - started).toFixed(1)}ms`);
    logger.info(
        `Native page-font source ready (LXGW ${(fontBuffer.length / 1024 / 1024).toFixed(1)} MB)`,
    );
    return {
        pageSubsetDir: resolve(projectRoot, PAGE_SLICE_OUT_DIR),
        fontBuffer,
        codeNormal,
        codeItalic,
    };
}

export interface PageFontSubset {
    html: string;
    filename: string;
    sourcePath: string;
    cacheHit: boolean;
}

type HtmlNode = DefaultTreeAdapterMap["node"];

const NON_RENDERED_ELEMENTS = new Set(["script", "style", "template", "title"]);
const VISUALLY_HIDDEN_CLASSES = new Set([
    "agent-home-summary",
    "screen-reader-only",
    "sr-only",
    "visually-hidden",
]);

function cssGeneratedText(css: string): string {
    return [...css.matchAll(/\bcontent\s*:\s*(["'])(.*?)\1\s*(?:!important\s*)?(?:;|})/gis)]
        .map(([, , value]) =>
            (value ?? "").replace(/\\([\da-f]{1,6})\s?|\\(.)/gi, (_, hex, char) =>
                hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : char,
            ),
        )
        .join(" ");
}

function collectStylesheetLinks(node: HtmlNode, output: string[]): void {
    if ("tagName" in node && node.tagName === "link") {
        const attrs = new Map(node.attrs.map(({ name, value }) => [name, value]));
        if (attrs.get("rel")?.split(/\s+/u).includes("stylesheet")) {
            const href = attrs.get("href");
            if (href) output.push(href);
        }
    }
    if ("childNodes" in node) {
        for (const child of node.childNodes) collectStylesheetLinks(child, output);
    }
}

/** Read local CSS files linked from an emitted page and return generated text strings. */
export function readLinkedStylesheetText(
    html: string,
    pagePath: string,
    outputDir: string,
    cache = new Map<string, string>(),
): string {
    const root = resolve(outputDir);
    const links: string[] = [];
    collectStylesheetLinks(parse(html), links);
    const content: string[] = [];
    for (const href of links) {
        if (/^(?:[a-z][a-z\d+.-]*:|\/\/|data:)/iu.test(href)) continue;
        let cssPath: string;
        try {
            cssPath = href.startsWith("/")
                ? resolve(root, `.${new URL(href, "https://stalux.local").pathname}`)
                : fileURLToPath(new URL(href, pathToFileURL(pagePath)));
        } catch {
            continue;
        }
        if (cssPath !== root && !cssPath.startsWith(`${root}${sep}`)) continue;
        if (!cache.has(cssPath)) {
            try {
                cache.set(cssPath, readFileSync(cssPath, "utf8"));
            } catch {
                cache.set(cssPath, "");
            }
        }
        content.push(cssGeneratedText(cache.get(cssPath) ?? ""));
    }
    return content.join(" ");
}

function findBody(node: HtmlNode): HtmlNode | undefined {
    if ("tagName" in node && node.tagName === "body") return node;
    if ("childNodes" in node) {
        for (const child of node.childNodes) {
            const body = findBody(child);
            if (body) return body;
        }
    }
    return undefined;
}

function isHiddenElement(attrs: Array<{ name: string; value: string }>): boolean {
    const attributes = new Map(attrs.map(({ name, value }) => [name, value]));
    if (attributes.has("hidden") || attributes.has("inert")) return true;

    const classes = (attributes.get("class") ?? "").split(/\s+/u);
    if (classes.some((name) => VISUALLY_HIDDEN_CLASSES.has(name))) return true;

    const style = attributes.get("style") ?? "";
    return /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden|content-visibility\s*:\s*hidden)\s*(?:;|$)/iu.test(
        style,
    );
}

/** Collect renderable body text nodes, including content inside collapsed controls. */
function collectBodyText(node: HtmlNode, output: string[]): void {
    if (node.nodeName === "#text" && "value" in node) {
        output.push(node.value);
        return;
    }

    if (!("childNodes" in node)) return;
    if (
        "tagName" in node &&
        (NON_RENDERED_ELEMENTS.has(node.tagName) || isHiddenElement(node.attrs))
    ) {
        return;
    }

    for (const child of node.childNodes) collectBodyText(child, output);
}

function formatUnicodeRange(chars: string[]): string {
    const points = chars.map((char) => char.codePointAt(0) as number).sort((a, b) => a - b);
    const ranges: Array<[number, number]> = [];
    for (const point of points) {
        const last = ranges.at(-1);
        if (last && point === last[1] + 1) last[1] = point;
        else ranges.push([point, point]);
    }
    const format = (point: number) => point.toString(16).toUpperCase().padStart(4, "0");
    return ranges
        .map(([start, end]) => `U+${format(start)}${start === end ? "" : `-${format(end)}`}`)
        .join(",");
}

/** Create a cached body-font subset containing the page's visible text characters. */
export function writePageFontSubset(
    html: string,
    fontBuffer: Buffer,
    cacheDir: string,
    publicUrlPrefix = "/_astro/fonts/",
    linkedStylesheetText = "",
): PageFontSubset | undefined {
    const document = parse(html);
    const body = findBody(document);
    if (!body) return undefined;

    const bodyText: string[] = [
        ...[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map(([, css]) =>
            cssGeneratedText(css ?? ""),
        ),
        linkedStylesheetText,
    ];
    collectBodyText(body, bodyText);
    const chars = [...new Set([...bodyText.join("")].filter((char) => !/\p{C}/u.test(char)))].sort(
        (a, b) => (a.codePointAt(0) as number) - (b.codePointAt(0) as number),
    );
    if (chars.length === 0) return undefined;

    const result = subsetFont(fontBuffer, chars.join(""), cacheDir);
    const filename = `page-${result.hash}.woff2`;

    const rel = `${publicUrlPrefix}${filename}`;
    // Keep Astro's broad unicode-range font out of the fallback stack; otherwise
    // a character outside this page's subset would download multiple 300 KB slices.
    const originalFontStack = html.match(/--font-body:\s*([^;}]+)/u)?.[1]?.trim();
    const fallbackStack =
        originalFontStack || '"Noto Sans SC","Noto Sans CJK SC",system-ui,sans-serif';
    const originalCodeStack = html.match(/--font-code:\s*([^;}]+)/u)?.[1]?.trim();
    const codeStack = originalCodeStack
        ? `${originalCodeStack},"LXGW WenKai-Page Subset"`
        : `"LXGW WenKai-Page Subset",${fallbackStack}`;
    // The source font is regular; advertise a weight range so browsers synthesize
    // bold weights from these same glyphs instead of falling back to system CJK.
    const css = `@font-face{font-family:"LXGW WenKai-Page Subset";src:url("${rel}") format("woff2");font-style:normal;font-weight:100 900;font-display:swap;unicode-range:${formatUnicodeRange(chars)}}:root{--font-body:"LXGW WenKai-Page Subset",${fallbackStack};--font-code:${codeStack}}body{font-family:var(--font-body),${fallbackStack}}`;
    const withoutBroadBodyFonts = html.replace(
        /@font-face\{[^}]*font-family:"LXGW WenKai-[^"]+"[^}]*\}/g,
        (face) => {
            const unicodeRange = face.match(/unicode-range:([^;}]+)/i)?.[1] ?? "";
            const hasCjkRange = unicodeRange.split(",").some((range) => {
                const start = range.match(/U\+([\da-f]+)/i)?.[1];
                if (!start) return false;
                const codePoint = Number.parseInt(start, 16);
                return codePoint >= 0x4e00 && codePoint <= 0x9fff;
            });
            return hasCjkRange ? "" : face;
        },
    );
    const outputHtml = withoutBroadBodyFonts.replace(
        /<\/head\s*>/i,
        `<style data-stalux-page-font>${css}</style></head>`,
    );
    return { html: outputHtml, filename, sourcePath: result.path, cacheHit: result.cacheHit };
}

/** Remove stale page subsets so deploy artifacts only contain the current build's referenced files. */
export function clearPageFontSubsets(
    outputDir: string,
    referencedFiles: Set<string> = new Set(),
): void {
    if (!existsSync(outputDir)) return;
    for (const name of readdirSync(outputDir)) {
        if (name.startsWith("page-") && name.endsWith(".woff2") && !referencedFiles.has(name)) {
            unlinkSync(join(outputDir, name));
        }
    }
}
