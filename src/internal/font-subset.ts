/**
 * Per-route font subsetting engine.
 *
 * Scans each content file individually, extracts its unique character set,
 * and generates a minimal WOFF2 subset per route. Also generates a "common"
 * subset for UI text (navs, i18n, layout).
 *
 * Output layout (under public/fonts/):
 *   fonts/
 *     common.woff2          — UI text subset (ASCII, nav, i18n)
 *     post-{abbrlink}.woff2 — per-post subset
 *     about.woff2           — about page subset
 *     words.woff2           — combined words subset
 *     manifest.json         — route → subset file mapping
 *     subset.css            — global @font-face declarations
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, basename, extname, join } from "node:path";

import type { AstroIntegrationLogger } from "astro";
// subset-font 是 WASM 模块，需要静态导入（Vite module runner 在构建钩子中不兼容动态 import）
import subsetFontFn from "subset-font";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Content root directory (relative to project root) */
const CONTENT_ROOT = "stalux";

/** Full font input path (relative to project root or package) */
const FONT_INPUT = "src/assets/fonts/LXGWWenKai-Regular.ttf";

/** Output directory for generated subsets */
const FONT_OUT_DIR = "public/fonts";

/** Characters always included in common subset */
const ALWAYS_INCLUDE_CHARS = new Set(
    // ASCII printable
    [...Array(0x7e - 0x20 + 1)]
        .map((_, i) => String.fromCodePoint(0x20 + i))
        .join("")
        // Basic CJK punctuation
        .concat(
            "\u3000\u3001\u3002\u3008\u3009\u300a\u300b\u300c\u300d\u3010\u3011" +
                "\uff01\uff08\uff09\uff0c\uff0e\uff1a\uff1b\uff1f\uff5e\u2013\u2014" +
                "\u2018\u2019\u201c\u201d\u2026\uff09\uff08\u00b7",
        ),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteCharSet {
    route: string;
    chars: string;
    hash: string;
}

interface FontManifest {
    common: string; // filename of common subset
    routes: Record<string, string>; // route → subset filename
    /** Per-post mapping: abbrlink → subset filename */
    posts: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Character extraction
// ---------------------------------------------------------------------------

function extractChars(text: string): string {
    const set = new Set<string>();
    for (const ch of text) set.add(ch);
    return [...set].sort().join("");
}

function hashChars(chars: string): string {
    return createHash("md5").update(chars).digest("hex").slice(0, 12);
}

// ---------------------------------------------------------------------------
// Content scanning
// ---------------------------------------------------------------------------

interface ContentFile {
    route: string;
    filePath: string;
    abbrlink?: string;
}

function scanContent(projectRoot: string): ContentFile[] {
    const files: ContentFile[] = [];
    const contentRoot = resolve(projectRoot, CONTENT_ROOT);

    // Posts
    const postsDir = join(contentRoot, "posts");
    if (existsSync(postsDir)) {
        for (const f of readdirSync(postsDir)) {
            if (!f.endsWith(".md") && !f.endsWith(".mdx")) continue;
            if (f.startsWith("_")) continue; // skip template files
            const content = readFileSync(join(postsDir, f), "utf-8");
            // Extract abbrlink from frontmatter
            const abbrlinkMatch = content.match(/^abbrlink:\s*(.+)$/m);
            const abbrlink = abbrlinkMatch?.[1]?.trim() ?? basename(f, extname(f));
            files.push({
                route: `posts/${abbrlink}`,
                filePath: join(postsDir, f),
                abbrlink,
            });
        }
    }

    // About
    const aboutDir = join(contentRoot, "about");
    if (existsSync(aboutDir)) {
        for (const f of readdirSync(aboutDir)) {
            if (!f.endsWith(".md") && !f.endsWith(".mdx")) continue;
            if (f.startsWith("_")) continue;
            files.push({
                route: "about",
                filePath: join(aboutDir, f),
            });
        }
    }

    // Words - aggregate all words files' characters into one
    const wordsDir = join(contentRoot, "words");
    if (existsSync(wordsDir)) {
        const allWordsContent: string[] = [];
        for (const f of readdirSync(wordsDir)) {
            if (!f.endsWith(".md")) continue;
            if (f.startsWith("_")) continue;
            try {
                allWordsContent.push(readFileSync(join(wordsDir, f), "utf-8"));
            } catch {
                /* skip */
            }
        }
        if (allWordsContent.length > 0) {
            files.push({
                route: "words",
                filePath: join(wordsDir, "words-combined.md"),
                // We'll handle this virtual file specially in char extraction
            });
            // Store combined content in a map for later extraction
            wordCharsCache.set("words", extractChars(allWordsContent.join("\n")));
        }
    }

    return files;
}

// Cache for virtual route char sets
const wordCharsCache = new Map<string, string>();

// ---------------------------------------------------------------------------
// Common subset: extract chars from UI source files
// ---------------------------------------------------------------------------

function collectCommonChars(projectRoot: string): string {
    const chars = new Set(ALWAYS_INCLUDE_CHARS);

    // Scan all source directories for UI text characters
    const srcDir = resolve(projectRoot, "src");

    function scanDir(dir: string) {
        if (!existsSync(dir)) return;
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                scanDir(fullPath);
            } else if (
                entry.name.endsWith(".astro") ||
                entry.name.endsWith(".ts") ||
                entry.name.endsWith(".json")
            ) {
                try {
                    const content = readFileSync(fullPath, "utf-8");
                    // Only extract string literals and text content (skip code)
                    for (const ch of content) chars.add(ch);
                } catch {
                    /* skip */
                }
            }
        }
    }

    scanDir(srcDir);

    return [...chars].sort().join("");
}

// ---------------------------------------------------------------------------
// Deduplication: merge files with identical char sets
// ---------------------------------------------------------------------------

function deduplicate(routes: RouteCharSet[]): Map<string, string[]> {
    // hash → [route1, route2, ...]
    const groups = new Map<string, string[]>();
    for (const r of routes) {
        const list = groups.get(r.hash) ?? [];
        list.push(r.route);
        groups.set(r.hash, list);
    }
    return groups;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Run font subsetting during build.
 * Called from astro:build:start hook.
 */
export async function runFontSubsetting(
  projectRoot: string,
  logger: AstroIntegrationLogger,
): Promise<void> {
  logger.info("Font subsetting: scanning content...");

  // 1. Locate font file (check project root first, then stalux package dir)
  const { fileURLToPath } = await import("node:url");
  const fontPaths = [
    resolve(projectRoot, FONT_INPUT),
    resolve(projectRoot, "node_modules", "@xingwangzhe", "stalux", FONT_INPUT),
    resolve(fileURLToPath(new URL("..", import.meta.url)), "..", FONT_INPUT),
  ];

  let fontPath: string | undefined;
  for (const p of fontPaths) {
    if (existsSync(p)) {
      fontPath = p;
      break;
    }
  }

  if (!fontPath) {
    logger.warn(`Font not found at ${FONT_INPUT}, skipping subsetting`);
    return;
  }
  const fontBuffer = readFileSync(fontPath);

    // 2. Scan content files
    const contentFiles = scanContent(projectRoot);
    logger.info(`Font subsetting: found ${contentFiles.length} content files`);

    // 3. Collect common chars (UI, nav, i18n)
    const commonChars = collectCommonChars(projectRoot);
    const commonHash = hashChars(commonChars);

    // 4. Extract per-route char sets
    const routeSets: RouteCharSet[] = [];
    for (const file of contentFiles) {
        let content: string;
        if (file.route === "words" && wordCharsCache.has("words")) {
            content = wordCharsCache.get("words")!;
        } else {
            content = readFileSync(file.filePath, "utf-8");
        }
        const chars = extractChars(content);
        routeSets.push({
            route: file.route,
            chars,
            hash: hashChars(chars),
        });
    }

    // 5. Deduplicate and generate subsets
    const outDir = resolve(projectRoot, FONT_OUT_DIR);
    mkdirSync(outDir, { recursive: true });

    // Dynamic import subset-font (ESM only)
    let subsetFont = subsetFontFn;

    // Generate common subset
    const commonFilename = `common-${commonHash}.woff2`;
    const commonOutPath = join(outDir, commonFilename);
    if (!existsSync(commonOutPath)) {
        const data = await subsetFont(fontBuffer, commonChars, { targetFormat: "woff2" });
        writeFileSync(commonOutPath, data);
        logger.info(`  common subset: ${(data.length / 1024).toFixed(1)} KB → ${commonFilename}`);
    }

    // Generate common CSS
    const commonCSS = `/* Auto-generated common font subset */
@font-face {
    font-family: "LXGW WenKai Subset";
    src: url("/fonts/${commonFilename}") format("woff2");
    font-display: swap;
}
`;
    writeFileSync(join(outDir, "common.css"), commonCSS);

    // Generate per-route subsets (deduplicated) and their CSS
    const groups = deduplicate(routeSets);
    const routeMap: Record<string, string> = {};
    const postMap: Record<string, string> = {};

    let subsetCount = 0;
    // Track which subsets we've already generated CSS for
    const cssGenerated = new Set<string>();

    for (const [hash, routes] of groups) {
        const filename = `subset-${hash}.woff2`;
        const outPath = join(outDir, filename);
        if (!existsSync(outPath)) {
            // Find the route chars for this hash
            const route = routeSets.find((r) => r.hash === hash);
            const chars = route?.chars ?? "";
            // Only subset characters NOT in common (already covered by common.css)
            const uniqueChars = chars
                .split("")
                .filter((ch) => !commonChars.includes(ch))
                .join("");
            if (uniqueChars.length > 0) {
                const data = await subsetFont(fontBuffer, uniqueChars, { targetFormat: "woff2" });
                writeFileSync(outPath, data);
                subsetCount++;
                logger.info(
                    `  subset ${subsetCount}: ${(data.length / 1024).toFixed(1)} KB → ${filename}`,
                );
            }
        }

        // Generate per-route CSS (one per unique hash, references all routes with this hash)
        if (!cssGenerated.has(hash)) {
            cssGenerated.add(hash);
            for (const route of routes) {
                const cssContent = `/* Auto-generated font subset for route: ${route} */
@font-face {
    font-family: "LXGW WenKai Subset";
    src: url("/fonts/${filename}") format("woff2");
    font-display: swap;
}
`;
                // Use first route's name as the CSS filename (they share the same subset)
                const cssName = routes.length === 1 ? route.replace("/", "-") : `group-${hash}`;
                const cssFilename = `subset-${cssName}.css`;
                writeFileSync(join(outDir, cssFilename), cssContent);
                routeMap[route] = cssFilename;

                if (route.startsWith("posts/")) {
                    const abbrlink = route.replace("posts/", "");
                    postMap[abbrlink] = cssFilename;
                }
            }
        } else {
            // CSS already generated, just map
            for (const route of routes) {
                const cssFilename =
                    routes.length === 1
                        ? `subset-${route.replace("/", "-")}.css`
                        : `subset-group-${hash}.css`;
                routeMap[route] = cssFilename;
                if (route.startsWith("posts/")) {
                    postMap[route.replace("posts/", "")] = cssFilename;
                }
            }
        }
    }

    // 6. Generate manifest
    const manifest: FontManifest = {
        common: commonFilename,
        routes: routeMap,
        posts: postMap,
    };
    writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

    logger.info(
        `Font subsetting done: ${subsetCount} route subsets + common (${(fontBuffer.length / 1024 / 1024).toFixed(1)} MB → variable)`,
    );
}
