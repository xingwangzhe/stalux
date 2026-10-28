import { styleNames } from "./style-names.generated.ts";
/**
 * Build-time CJK font subsetting engine.
 *
 * LXGW WenKai uses shared subsets for the persistent header and footer, then
 * one content-addressed subset per rendered page for the remaining glyphs.
 * Only the independent Google Sans Code font uses Astro's local Fonts API.
 *
 * Astro's local provider reads font files from disk (`readFile`), so no
 * network access is involved at build time — identical behavior on GitHub
 * Actions and CN mirrors. Page subset cache is emitted to `node_modules/.astro/`
 * so it stays out of the repo and out of `dist/fonts`.
 *
 * Output layout:
 *   node_modules/.astro/stalux-page-fonts/
 *     page-{hash}.woff2          — page-specific content-addressed CJK subset
 *     shared-header/footer-*.woff2 — persistent shell glyph subsets
 */

import { existsSync, readdirSync, readFileSync, unlinkSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FontSubsetter } from "@xingwangzhe/cjk-font-split-native";
import type { AstroIntegrationLogger } from "astro";
import {
    type DefaultTreeAdapterMap,
    defaultTreeAdapter,
    html as htmlNamespaces,
    parse,
    serialize,
} from "parse5";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Full font input path (relative to project root or package) */
const FONT_INPUT = "src/assets/fonts/LXGWWenKai-Regular.ttf";

/** Code font input paths (variable fonts, registered as-is, no slicing) */
const CODE_FONT_INPUT = "src/assets/fonts/GoogleSansCode.woff2";
const CODE_FONT_ITALIC_INPUT = "src/assets/fonts/GoogleSansCode-Italic.woff2";

const PAGE_SLICE_OUT_DIR = "node_modules/.astro/stalux-page-fonts";

/**
 * Characters always reserved in every page subset, regardless of page content.
 *
 * Digits are extracted from rendered text nodes, so any number produced at
 * runtime (clock, counters, dates, values injected by client scripts) or
 * carried only in attributes would fall outside the subset and render as
 * fallback glyphs — a visible "font splitting" bug. Reserving 0-9 costs
 * ~10 glyphs per page and makes digit rendering unconditional.
 */
export const RESERVED_GLYPHS = "0123456789";

const preparedFonts = new WeakMap<Buffer, FontSubsetter>();

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
 * Resolve the body-font source for native shell/page subsetting and code fonts for
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
    glyphCount: number;
}

export type SharedFontGroup = "header" | "footer";

export interface SharedFontGlyphs {
    header: Set<string>;
    footer: Set<string>;
}

export interface SharedFontSubset {
    group: SharedFontGroup;
    family: string;
    chars: string[];
    filename: string;
    sourcePath: string;
    cacheHit: boolean;
}

const SHARED_FONT_FAMILIES: Record<SharedFontGroup, string> = {
    header: "LXGW WenKai Header Subset",
    footer: "LXGW WenKai Footer Subset",
};

type HtmlNode = DefaultTreeAdapterMap["node"];

const NON_RENDERED_ELEMENTS = new Set(["script", "style", "template", "title"]);
const VISUALLY_HIDDEN_CLASSES = new Set([
    "agent-home-summary",
    styleNames.classes["agent-home-summary"] ?? "agent-home-summary",
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
    document = parse(html),
    dependencies?: Set<string>,
): string {
    const root = resolve(outputDir);
    const links: string[] = [];
    collectStylesheetLinks(document, links);
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
        dependencies?.add(cssPath);
        if (!cache.has(cssPath)) {
            try {
                cache.set(cssPath, cssGeneratedText(readFileSync(cssPath, "utf8")));
            } catch {
                cache.set(cssPath, "");
            }
        }
        content.push(cache.get(cssPath) ?? "");
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
    let className = "";
    let style = "";
    for (const attr of attrs) {
        if (attr.name === "hidden" || attr.name === "inert") return true;
        if (attr.name === "class") className = attr.value;
        if (attr.name === "style") style = attr.value;
    }
    const classes = className.split(/\s+/u);
    if (classes.some((name) => VISUALLY_HIDDEN_CLASSES.has(name))) return true;

    return /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden|content-visibility\s*:\s*hidden)\s*(?:;|$)/iu.test(
        style,
    );
}

/** Collect renderable text nodes, including content inside collapsed controls. */
const CONTROL_CHARACTER = /\p{C}/u;
function addGlyphs(text: string, output: Set<string>): void {
    for (const char of text)
        if (!(output.has(char) || CONTROL_CHARACTER.test(char))) output.add(char);
}

function collectBodyText(node: HtmlNode, output: Set<string>, skipSharedComponents = false): void {
    if (node.nodeName === "#text" && "value" in node) {
        addGlyphs(node.value, output);
        return;
    }

    if (!("childNodes" in node)) return;
    if ("tagName" in node) {
        const sharedGroup = node.attrs.find(
            (attribute) => attribute.name === "data-stalux-font-group",
        )?.value;
        if (skipSharedComponents && (sharedGroup === "header" || sharedGroup === "footer")) {
            return;
        }
        if (NON_RENDERED_ELEMENTS.has(node.tagName) || isHiddenElement(node.attrs)) return;
    }

    for (const child of node.childNodes) collectBodyText(child, output, skipSharedComponents);
}

/** Collect common shell glyphs separately so every page can reuse the same files. */
export function createSharedFontGlyphs(): SharedFontGlyphs {
    const glyphs: SharedFontGlyphs = { header: new Set(), footer: new Set() };
    addGlyphs(RESERVED_GLYPHS, glyphs.footer);
    return glyphs;
}

export function collectSharedFontGlyphs(
    document: DefaultTreeAdapterMap["document"],
    output: SharedFontGlyphs,
): void {
    function visit(node: HtmlNode): void {
        if ("tagName" in node) {
            const group = node.attrs.find(
                (attribute) => attribute.name === "data-stalux-font-group",
            )?.value as SharedFontGroup | undefined;
            if (group === "header" || group === "footer") {
                collectBodyText(node, output[group]);
                return;
            }
        }
        if ("childNodes" in node) for (const child of node.childNodes) visit(child);
    }
    visit(document);
}

function sortGlyphs(glyphs: Iterable<string>): string[] {
    return [...new Set(glyphs)].sort(
        (a, b) => (a.codePointAt(0) as number) - (b.codePointAt(0) as number),
    );
}

/** Build content-addressed header and footer subsets once for the whole site build. */
export async function writeSharedFontSubsetsAsync(
    fontBuffer: Buffer,
    glyphs: SharedFontGlyphs,
    cacheDir: string,
): Promise<SharedFontSubset[]> {
    let prepared = preparedFonts.get(fontBuffer);
    if (!prepared) {
        prepared = new FontSubsetter(fontBuffer);
        preparedFonts.set(fontBuffer, prepared);
    }

    const subsets: SharedFontSubset[] = [];
    for (const group of ["header", "footer"] as const) {
        const chars = sortGlyphs(glyphs[group]);
        if (chars.length === 0) continue;
        const result = await prepared.subsetAsync(chars.join(""), cacheDir);
        subsets.push({
            group,
            family: SHARED_FONT_FAMILIES[group],
            chars,
            filename: `shared-${group}-${result.hash}.woff2`,
            sourcePath: result.path,
            cacheHit: result.cacheHit,
        });
    }
    return subsets;
}

export function sharedFontCacheKey(subsets: readonly SharedFontSubset[]): string {
    return subsets.map(({ group, chars }) => `${group}:${chars.join("")}`).join("\0");
}

function formatUnicodeRange(chars: string[]): string {
    const ranges: Array<[number, number]> = [];
    // preparePageFont already sorts the unique glyphs by code point.
    for (const char of chars) {
        const point = char.codePointAt(0) as number;
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
    extraChars = "",
    document = parse(html),
): PageFontSubset | undefined {
    const input = preparePageFont(fontBuffer, linkedStylesheetText, extraChars, document);
    if (!input) return undefined;
    const result = renderPageFont(
        document,
        publicUrlPrefix,
        input.chars,
        input.prepared.subset(input.chars.join(""), cacheDir),
        [],
    );
    return { ...result, glyphCount: input.chars.length, html: serialize(document) };
}

export async function writePageFontSubsetAsync(
    html: string,
    fontBuffer: Buffer,
    cacheDir: string,
    publicUrlPrefix = "/_astro/fonts/",
    linkedStylesheetText = "",
    extraChars = "",
    document = parse(html),
): Promise<PageFontSubset | undefined> {
    const input = preparePageFont(fontBuffer, linkedStylesheetText, extraChars, document);
    if (!input) return undefined;
    const result = await input.prepared.subsetAsync(input.chars.join(""), cacheDir);
    return {
        ...renderPageFont(document, publicUrlPrefix, input.chars, result, []),
        glyphCount: input.chars.length,
        html: serialize(document),
    };
}

function preparePageFont(
    fontBuffer: Buffer,
    linkedStylesheetText: string,
    extraChars: string,
    document: DefaultTreeAdapterMap["document"],
    excludedChars: ReadonlySet<string> = new Set(),
) {
    const body = findBody(document);
    if (!body) return;

    const glyphs = new Set<string>();
    addGlyphs(RESERVED_GLYPHS, glyphs);
    addGlyphs(extraChars, glyphs);
    addGlyphs(linkedStylesheetText, glyphs);
    for (const style of collectInlineStyles(document))
        addGlyphs(cssGeneratedText(styleText(style)), glyphs);
    collectBodyText(body, glyphs, true);
    for (const char of excludedChars) glyphs.delete(char);
    // Keep runtime digits available even when the shell subset does not contain them.
    addGlyphs(RESERVED_GLYPHS, glyphs);
    const chars = [...glyphs].sort(
        (a, b) => (a.codePointAt(0) as number) - (b.codePointAt(0) as number),
    );
    if (chars.length === 0) return;

    let prepared = preparedFonts.get(fontBuffer);
    if (!prepared) {
        prepared = new FontSubsetter(fontBuffer);
        preparedFonts.set(fontBuffer, prepared);
    }
    return { chars, prepared };
}

function renderPageFont(
    document: DefaultTreeAdapterMap["document"],
    publicUrlPrefix: string,
    chars: string[],
    result: { hash: string; path: string; cacheHit: boolean },
    sharedFonts: readonly SharedFontSubset[],
): Omit<PageFontSubset, "html"> {
    const filename = `page-${result.hash}.woff2`;

    const rel = `${publicUrlPrefix}${filename}`;
    // Keep Astro's broad unicode-range font out of the fallback stack; otherwise
    // a character outside this page's subset would download multiple 300 KB slices.
    const styles = collectInlineStyles(document);
    const originalFontStack = styles
        .map(styleText)
        .map((css) => css.match(/--font-body:\s*([^;}]+)/u)?.[1]?.trim())
        .find(Boolean);
    const fallbackStack =
        originalFontStack || '"Noto Sans SC","Noto Sans CJK SC",system-ui,sans-serif';
    const originalCodeStack = styles
        .map(styleText)
        .map((css) => css.match(/--font-code:\s*([^;}]+)/u)?.[1]?.trim())
        .find(Boolean);
    const sharedStack = sharedFonts.map(({ family }) => `"${family}"`).join(",");
    const pageFontStack = [sharedStack, '"LXGW WenKai-Page Subset"', fallbackStack]
        .filter(Boolean)
        .join(",");
    const codeStack = originalCodeStack ? `${originalCodeStack},${pageFontStack}` : pageFontStack;
    // The source font is regular; advertise a weight range so browsers synthesize
    // bold weights from these same glyphs instead of falling back to system CJK.
    const sharedFaces = sharedFonts
        .map(
            ({ family, filename, chars: sharedChars }) =>
                `@font-face{font-family:"${family}";src:url("${publicUrlPrefix}${filename}") format("woff2");font-style:normal;font-weight:100 900;font-display:swap;unicode-range:${formatUnicodeRange(sharedChars)}}`,
        )
        .join("");
    const css = `${sharedFaces}@font-face{font-family:"LXGW WenKai-Page Subset";src:url("${rel}") format("woff2");font-style:normal;font-weight:100 900;font-display:swap;unicode-range:${formatUnicodeRange(chars)}}:root{--font-body:${pageFontStack};--font-code:${codeStack}}body{font-family:var(--font-body),${fallbackStack}}`;
    for (const style of styles) {
        for (const node of style.childNodes) {
            if (node.nodeName !== "#text" || !("value" in node)) continue;
            node.value = node.value.replace(
                /@font-face\{[^}]*font-family:"LXGW WenKai-[^"]+"[^}]*\}/g,
                (face) => {
                    const unicodeRange = face.match(/unicode-range:([^;}]+)/i)?.[1] ?? "";
                    const hasCjkRange = unicodeRange.split(",").some((range) => {
                        const start = range.match(/U\+([\da-f]+)/i)?.[1];
                        if (!start) return false;
                        const point = Number.parseInt(start, 16);
                        return point >= 0x4e00 && point <= 0x9fff;
                    });
                    return hasCjkRange ? "" : face;
                },
            );
        }
    }
    const head = document.childNodes
        .flatMap((node) => ("childNodes" in node ? node.childNodes : []))
        .find((node) => "tagName" in node && node.tagName === "head");
    if (head && "childNodes" in head) {
        const style = defaultTreeAdapter.createElement("style", htmlNamespaces.NS.HTML, [
            { name: "data-stalux-page-font", value: "" },
        ]);
        const preload = defaultTreeAdapter.createElement("link", htmlNamespaces.NS.HTML, [
            { name: "rel", value: "preload" },
            { name: "as", value: "font" },
            { name: "type", value: "font/woff2" },
            { name: "crossorigin", value: "anonymous" },
            { name: "href", value: rel },
            { name: "data-stalux-page-font-preload", value: "" },
        ]);
        for (const sharedFont of sharedFonts) {
            if (sharedFont.group !== "header") continue;
            const sharedPreload = defaultTreeAdapter.createElement("link", htmlNamespaces.NS.HTML, [
                { name: "rel", value: "preload" },
                { name: "as", value: "font" },
                { name: "type", value: "font/woff2" },
                { name: "crossorigin", value: "anonymous" },
                { name: "href", value: `${publicUrlPrefix}${sharedFont.filename}` },
                { name: "data-stalux-shared-font-preload", value: sharedFont.group },
            ]);
            defaultTreeAdapter.appendChild(head, sharedPreload);
        }
        defaultTreeAdapter.appendChild(head, preload);
        defaultTreeAdapter.insertText(style, css);
        defaultTreeAdapter.appendChild(head, style);
    }
    return {
        filename,
        sourcePath: result.path,
        cacheHit: result.cacheHit,
        glyphCount: chars.length,
    };
}

/** Styles are selected structurally, so examples in scripts/comments/templates are untouched. */
function collectInlineStyles(document: HtmlNode): DefaultTreeAdapterMap["element"][] {
    const styles: DefaultTreeAdapterMap["element"][] = [];
    function visit(node: HtmlNode) {
        if ("tagName" in node) {
            if (node.tagName === "template") return;
            if (node.tagName === "style") styles.push(node);
        }
        if ("childNodes" in node) for (const child of node.childNodes) visit(child);
    }
    visit(document);
    return styles;
}

function styleText(style: DefaultTreeAdapterMap["element"]): string {
    return style.childNodes.map((node) => ("value" in node ? node.value : "")).join("");
}

/** Remove previously generated styles by AST identity, never by matching HTML strings. */
export function removePageFontStyles(document: DefaultTreeAdapterMap["document"]): void {
    function removePreloads(node: HtmlNode): void {
        if ("tagName" in node && node.tagName === "template") return;
        if (
            "tagName" in node &&
            node.tagName === "link" &&
            node.attrs.some(
                (attr) =>
                    attr.name === "data-stalux-page-font-preload" ||
                    attr.name === "data-stalux-shared-font-preload",
            )
        ) {
            defaultTreeAdapter.detachNode(node);
            return;
        }
        if ("childNodes" in node) for (const child of [...node.childNodes]) removePreloads(child);
    }
    removePreloads(document);
    for (const style of collectInlineStyles(document)) {
        if (style.attrs.some((attribute) => attribute.name === "data-stalux-page-font"))
            defaultTreeAdapter.detachNode(style);
    }
}

/** Subset and inject into the caller's AST without serializing an intermediate page. */
export async function writePageFontSubsetIntoDocumentAsync(
    document: DefaultTreeAdapterMap["document"],
    fontBuffer: Buffer,
    cacheDir: string,
    publicUrlPrefix = "/_astro/fonts/",
    linkedStylesheetText = "",
    sharedFonts: readonly SharedFontSubset[] = [],
): Promise<Omit<PageFontSubset, "html"> | undefined> {
    const sharedChars = new Set(sharedFonts.flatMap(({ chars }) => chars));
    const input = preparePageFont(fontBuffer, linkedStylesheetText, "", document, sharedChars);
    if (!input) return undefined;
    const result = await input.prepared.subsetAsync(input.chars.join(""), cacheDir);
    const rendered = renderPageFont(document, publicUrlPrefix, input.chars, result, sharedFonts);
    return {
        filename: rendered.filename,
        sourcePath: rendered.sourcePath,
        cacheHit: rendered.cacheHit,
        glyphCount: rendered.glyphCount,
    };
}

/** Remove stale page subsets so deploy artifacts only contain the current build's referenced files. */
export function clearPageFontSubsets(
    outputDir: string,
    referencedFiles: Set<string> = new Set(),
): void {
    if (!existsSync(outputDir)) return;
    for (const name of readdirSync(outputDir)) {
        const isSubset =
            name.startsWith("page-") ||
            name.startsWith("shared-header-") ||
            name.startsWith("shared-footer-");
        if (isSubset && name.endsWith(".woff2") && !referencedFiles.has(name)) {
            unlinkSync(join(outputDir, name));
        }
    }
}
