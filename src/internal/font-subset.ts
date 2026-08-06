/**
 * Per-route font subsetting engine.
 *
 * Scans each content file individually, extracts its unique character set,
 * and generates a minimal TTF subset per route. Also generates a "common"
 * subset for UI text (navs, i18n, layout).
 *
 * Output layout (under public/fonts/):
 *   fonts/
 *     common-{hash}.ttf       — UI text subset (ASCII, nav, i18n)
 *     subset-{hash}.ttf       — per-route subset (shared by routes with same chars)
 *     common.css              — @font-face for common subset
 *     subset-{route}.css      — per-route @font-face
 *     manifest.json           — route → subset file mapping
 */

import { createHash } from "node:crypto";
import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
    readdirSync,
    unlinkSync,
} from "node:fs";
import { resolve, basename, extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegrationLogger } from "astro";
// 与 Astro 内容集合同款的 YAML 解析器（astro 依赖 js-yaml 解析 frontmatter，
// 见 node_modules/astro/dist/content/loaders/file.js）。用它解析 frontmatter
// 得到的结果与 getCollection 的 data 一致：引号剥离、类型还原、结构完整。
import { load as parseYaml } from "js-yaml";
import subsetFont from "subset-font";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Content root directory (relative to project root) */
const CONTENT_ROOT = "stalux";

/** Full font input path (relative to project root or package) */
const FONT_INPUT = "src/assets/fonts/LXGWWenKai-Regular.ttf";

/** Code font input path (Google Sans Code, deterministic static @font-face) */
const CODE_FONT_INPUT = "src/assets/fonts/GoogleSansCode.woff2";

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
    common: string; // filename of common subset TTF
    commonCss: string; // filename of common subset CSS (content-addressed)
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

/**
 * 用 js-yaml（内容集合同款解析器）解析 frontmatter。
 *
 * 结果与 getCollection("posts") 的 data 一致：
 * - abbrlink：number 转 string、引号剥离（YAML 解析天然处理）
 * - tags/categories：单行字符串 "Bing" 按 schema preprocess 转 ["Bing"]
 */
function parsePostFrontmatter(content: string): {
    abbrlink?: string;
    tags: string[];
    categories: string[];
} {
    const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) return { abbrlink: undefined, tags: [], categories: [] };

    let data: Record<string, unknown>;
    try {
        data = (parseYaml(m[1]) as Record<string, unknown>) ?? {};
    } catch {
        return { abbrlink: undefined, tags: [], categories: [] };
    }

    // 复刻 posts schema 的 preprocess：单行字符串转数组
    const toList = (v: unknown): string[] => {
        if (Array.isArray(v)) return v.map((x) => String(x));
        if (typeof v === "string") return v.trim() ? [v.trim()] : [];
        return [];
    };

    const abbr = data.abbrlink;
    return {
        abbrlink: abbr === undefined || abbr === null ? undefined : String(abbr),
        tags: toList(data.tags),
        categories: toList(data.categories),
    };
}

function scanContent(projectRoot: string): ContentFile[] {
    const files: ContentFile[] = [];
    const contentRoot = resolve(projectRoot, CONTENT_ROOT);

    // Posts
    const postsDir = join(contentRoot, "posts");
    const allPostContents: {
        abbrlink: string;
        tags: string[];
        categories: string[];
        content: string;
    }[] = [];
    if (existsSync(postsDir)) {
        for (const f of readdirSync(postsDir)) {
            if (!f.endsWith(".md") && !f.endsWith(".mdx")) continue;
            const content = readFileSync(join(postsDir, f), "utf-8");
            const fm = parsePostFrontmatter(content);

            // Per-post routes：与内容集合 glob（*.{md,mdx}，含 _ 前缀文件，
            // 见 schemas/collections.ts）保持一致——这些文件都会生成页面，
            // 字体子集必须覆盖，否则页面 subset css 缺失 → 404。
            const abbrlink = fm.abbrlink ?? basename(f, extname(f));
            files.push({
                route: `posts/${abbrlink}`,
                filePath: join(postsDir, f),
                abbrlink,
            });
            // Virtual routes (archives/tags/categories): include ALL posts including templates
            // because content collections load them and they render on those pages
            allPostContents.push({
                abbrlink,
                tags: fm.tags,
                categories: fm.categories,
                content,
            });
        }
    }

    // Build virtual routes for archives, tags, categories (aggregated pages)
    // These pages render content from ALL posts
    if (allPostContents.length > 0) {
        const allContent = allPostContents.map((p) => p.content).join("\n");

        // Archives: all posts' content (titles, dates, etc.)
        virtualRouteCache.set("archives", extractChars(allContent));

        // Tags index: all tags + all posts' content
        const allTags = [...new Set(allPostContents.flatMap((p) => p.tags))].join(" ");
        virtualRouteCache.set("tags", extractChars(allContent + allTags));

        // Categories index: all categories + all posts' content
        const allCategories = [...new Set(allPostContents.flatMap((p) => p.categories))].join(" ");
        virtualRouteCache.set("categories", extractChars(allContent + allCategories));

        // Per-tag routes: tag name + posts with that tag
        const tagPosts = new Map<string, string[]>();
        for (const p of allPostContents) {
            for (const tag of p.tags) {
                const list = tagPosts.get(tag) ?? [];
                list.push(p.content);
                tagPosts.set(tag, list);
            }
        }
        for (const [tag, contents] of tagPosts) {
            const tagContent = tag + " " + contents.join("\n");
            virtualRouteCache.set(`tags-${tag}`, extractChars(tagContent));
        }

        // Per-category routes: category name + posts in that category
        const catPosts = new Map<string, string[]>();
        for (const p of allPostContents) {
            for (const cat of p.categories) {
                const list = catPosts.get(cat) ?? [];
                list.push(p.content);
                catPosts.set(cat, list);
            }
        }
        for (const [cat, contents] of catPosts) {
            const catContent = cat + " " + contents.join("\n");
            virtualRouteCache.set(`categories-${cat}`, extractChars(catContent));
        }
    }

    // Build virtual routes for config-driven pages (home, links)
    // These pages render text from config YAML files (nav titles, site title, etc.)
    const configDir = join(contentRoot, "config");
    if (existsSync(configDir)) {
        const allConfigContent: string[] = [];
        for (const f of readdirSync(configDir)) {
            if (f.endsWith(".yml") || f.endsWith(".yaml")) {
                allConfigContent.push(readFileSync(join(configDir, f), "utf-8"));
            }
        }
        if (allConfigContent.length > 0) {
            const configText = allConfigContent.join("\n");
            // Home page: site title, author, navs, typetexts, social media, footer
            virtualRouteCache.set("home", extractChars(configText));
            // Links page: links config + navs + footer
            virtualRouteCache.set("links", extractChars(configText));
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

    // Add virtual routes (archives, tags, categories) as content files
    for (const [route] of virtualRouteCache) {
        files.push({
            route,
            filePath: resolve(projectRoot, CONTENT_ROOT, `_virtual/${route}.md`),
        });
    }

    return files;
}

// Cache for virtual route char sets
const wordCharsCache = new Map<string, string>();
const virtualRouteCache = new Map<string, string>();

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

    // Also scan user config YAML files for nav titles, descriptions, etc.
    const configDir = resolve(projectRoot, CONTENT_ROOT, "config");
    if (existsSync(configDir)) {
        for (const f of readdirSync(configDir)) {
            if (!f.endsWith(".yml") && !f.endsWith(".yaml")) continue;
            try {
                const content = readFileSync(join(configDir, f), "utf-8");
                for (const ch of content) chars.add(ch);
            } catch {
                /* skip */
            }
        }
    }

    // Also scan post frontmatter for tags, categories so those pages' chars are covered
    const postsDir = resolve(projectRoot, CONTENT_ROOT, "posts");
    if (existsSync(postsDir)) {
        for (const f of readdirSync(postsDir)) {
            if (!f.endsWith(".md") && !f.endsWith(".mdx")) continue;
            if (f.startsWith("_")) continue;
            try {
                const content = readFileSync(join(postsDir, f), "utf-8");
                for (const ch of content) chars.add(ch);
            } catch {
                /* skip */
            }
        }
    }

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
 * Called from integration hooks.
 *
 * @param projectRoot - Project root directory
 * @param logger - Astro integration logger
 * @param skipPerRoute - Skip per-route subsets (for dev mode, only generate common)
 */
export async function runFontSubsetting(
    projectRoot: string,
    logger: AstroIntegrationLogger,
    skipPerRoute = false,
): Promise<void> {
    logger.info("Font subsetting: scanning content...");

    // 1. Locate font file (check project root first, then stalux package dir)
    const fontPaths = [
        resolve(projectRoot, FONT_INPUT),
        resolve(projectRoot, "node_modules", "@xingwangzhe", "stalux", FONT_INPUT),
        resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", FONT_INPUT),
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

    // Clean old generated font files to avoid stale cached references
    const outDir = resolve(projectRoot, FONT_OUT_DIR);
    if (existsSync(outDir)) {
        for (const f of readdirSync(outDir)) {
            if (f.startsWith("common-") || f.startsWith("subset-") || f === "common.css") {
                try {
                    unlinkSync(join(outDir, f));
                } catch {
                    /* skip */
                }
            }
        }
    }

    // 1.5 代码字体（Google Sans Code）— 确定性静态 @font-face，不经过 Astro 字体管线
    // Astro 的 <Font> 组件会在 prerender 阶段启动一个随机端口的 HTTP server，
    // 端口号会嵌进 font-file-url-resolver 虚拟模块的编译产物，破坏增量构建依赖图 hash。
    // 这里直接复制 woff2 到 public/fonts/ 并生成静态 code.css，完全绕开该管线。
    try {
        const codeFontPaths = [
            resolve(projectRoot, CODE_FONT_INPUT),
            resolve(projectRoot, "node_modules", "@xingwangzhe", "stalux", CODE_FONT_INPUT),
            resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", CODE_FONT_INPUT),
        ];
        const codeFontPath = codeFontPaths.find((p) => existsSync(p));
        if (codeFontPath) {
            const codeFontBuffer = readFileSync(codeFontPath);
            const codeFontOut = join(outDir, "GoogleSansCode.woff2");
            if (!existsSync(codeFontOut) || !readFileSync(codeFontOut).equals(codeFontBuffer)) {
                writeFileSync(codeFontOut, codeFontBuffer);
                logger.info(
                    `  code font: ${codeFontBuffer.length / 1024} KB → GoogleSansCode.woff2`,
                );
            }
            // 静态 CSS：@font-face + --font-code 变量（确定性内容，无 hash）
            const codeCSS = `/* Auto-generated code font (deterministic, no Astro font pipeline) */
:root {
    --font-code: "Google Sans Code", "JetBrains Mono", "Fira Code", "Consolas", "Courier New", monospace;
}
@font-face {
    font-family: "Google Sans Code";
    src: url("/fonts/GoogleSansCode.woff2") format("woff2");
    font-display: swap;
}
`;
            writeFileSync(join(outDir, "code.css"), codeCSS);
        } else {
            logger.warn(
                `Code font not found at ${CODE_FONT_INPUT}, --font-code falls back to system monospace`,
            );
        }
    } catch (error) {
        logger.warn(`Code font setup failed: ${String(error)}`);
    }

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
        } else if (virtualRouteCache.has(file.route)) {
            content = virtualRouteCache.get(file.route)!;
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

    // 5. Deduplicate and generate subsets using subset-font (WASM)
    mkdirSync(outDir, { recursive: true });

    // Helper: subset using subset-font (async WASM)
    async function doSubset(chars: string): Promise<Uint8Array> {
        if (!chars) return new Uint8Array(0);
        try {
            const result = await subsetFont(fontBuffer, chars, {
                targetFormat: "sfnt", // "sfnt" = TTF output
            });
            return result;
        } catch {
            return new Uint8Array(0);
        }
    }

    // Generate common subset
    const commonFilename = `common-${commonHash}.ttf`;
    const commonOutPath = join(outDir, commonFilename);
    if (!existsSync(commonOutPath)) {
        const data = await doSubset(commonChars);
        if (data.length > 0) {
            writeFileSync(commonOutPath, data);
            logger.info(
                `  common subset: ${(data.length / 1024).toFixed(1)} KB → ${commonFilename}`,
            );
        }
    }

    // Generate common CSS (content-addressed filename: 字符集变化 → hash 变化 →
    // 文件名变化，浏览器必然拉新 CSS，避免缓存旧 CSS 引用已删除的旧 TTF 导致 404)
    // dev 模式（skipPerRoute）用固定名 common.css，由 dev 中间件场景复用；
    // 生产构建用 common-<hash>.css，HTML 从 manifest 读取引用。
    const commonCssName = skipPerRoute ? "common.css" : `common-${commonHash}.css`;
    const commonCSS = `/* Auto-generated common font subset */
@font-face {
    font-family: "LXGW WenKai Subset";
    src: url("/fonts/${commonFilename}") format("truetype");
    font-display: swap;
}
`;
    writeFileSync(join(outDir, commonCssName), commonCSS);

    const groups = deduplicate(routeSets);
    const routeMap: Record<string, string> = {};
    const postMap: Record<string, string> = {};

    let subsetCount = 0;

    if (!skipPerRoute) {
        for (const [hash, routes] of groups) {
            const filename = `subset-${hash}.ttf`;
            const outPath = join(outDir, filename);
            if (!existsSync(outPath)) {
                const route = routeSets.find((r) => r.hash === hash);
                const chars = route?.chars ?? "";
                const uniqueChars = chars
                    .split("")
                    .filter((ch) => !commonChars.includes(ch))
                    .join("");
                if (uniqueChars.length > 0) {
                    const data = await doSubset(uniqueChars);
                    if (data.length > 0) {
                        writeFileSync(outPath, data);
                        subsetCount++;
                        logger.info(
                            `  subset ${subsetCount}: ${(data.length / 1024).toFixed(1)} KB → ${filename}`,
                        );
                    }
                }
            }

            // Generate per-route CSS (each route gets its own CSS file)
            // CSS 文件名内容寻址：内容只引用一个 TTF，文件名带上该 TTF 的 hash，
            // 内容变化 → 文件名变化 → 浏览器必然拉新，避免缓存旧 CSS 引用已删除 TTF。
            // If no unique chars, reference the common TTF as fallback
            const refTtf = existsSync(outPath) ? filename : commonFilename;
            const refHash = existsSync(outPath) ? hash : commonHash;
            for (const route of routes) {
                const cssContent = `/* Auto-generated font subset for route: ${route} */
@font-face {
    font-family: "LXGW WenKai Subset";
    src: url("/fonts/${refTtf}") format("truetype");
    font-display: swap;
}
`;
                const cssName = route.replace("/", "-");
                const cssFilename = `subset-${cssName}-${refHash}.css`;
                writeFileSync(join(outDir, cssFilename), cssContent);
                routeMap[route] = cssFilename;

                if (route.startsWith("posts/")) {
                    const abbrlink = route.replace("posts/", "");
                    postMap[abbrlink] = cssFilename;
                }
            }
        }
    }

    // 6. Generate manifest（dev 也生成：routes/posts 为空，供 Stalux.astro import）
    const manifest: FontManifest = {
        common: commonFilename,
        commonCss: commonCssName,
        routes: routeMap,
        posts: postMap,
    };
    writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

    // 副本写入包内 generated/：Stalux.astro import 它，让 manifest 进入 Astro
    // 依赖图——manifest 变化时页面必然重建，增量构建 restored 的页面不会引用旧资源。
    const genDir = resolve(dirname(fileURLToPath(import.meta.url)), "generated");
    mkdirSync(genDir, { recursive: true });
    writeFileSync(join(genDir, "fonts-manifest.json"), JSON.stringify(manifest));

    logger.info(
        `Font subsetting done: ${subsetCount} route subsets + common (${(fontBuffer.length / 1024 / 1024).toFixed(1)} MB → variable)`,
    );
}
