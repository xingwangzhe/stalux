/**
 * Dev mode on-demand font subsetting middleware.
 *
 * Intercepts /fonts/subset-*.css requests, generates the TTF subset
 * for the requested route on-the-fly, and serves it.
 *
 * Handles ALL HTML routes: posts, about, words, home, archives, tags, etc.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegrationLogger } from "astro";
import subsetFont from "subset-font";

const FONT_INPUT = "src/assets/fonts/LXGWWenKai-Regular.ttf";
const CONTENT_ROOT = "stalux";
const FONT_OUT_DIR = "public/fonts";

/**
 * Get characters for a given route subset.
 * Returns null if route is unknown.
 */
function getRouteChars(projectRoot: string, subsetId: string): string | null {
    const contentRoot = resolve(projectRoot, CONTENT_ROOT);

    // ── Posts ──────────────────────────────────────────────
    if (subsetId.startsWith("posts-")) {
        const abbrlink = subsetId.slice(6);
        const postsDir = join(contentRoot, "posts");
        if (!existsSync(postsDir)) return null;
        for (const f of readdirSync(postsDir)) {
            if ((f.endsWith(".md") || f.endsWith(".mdx")) && !f.startsWith("_")) {
                const content = readFileSync(join(postsDir, f), "utf-8");
                if (content.includes(`abbrlink: ${abbrlink}`)) return content;
            }
        }
        return null;
    }

    // ── About ──────────────────────────────────────────────
    if (subsetId === "about") {
        const aboutDir = join(contentRoot, "about");
        if (!existsSync(aboutDir)) return null;
        for (const f of readdirSync(aboutDir)) {
            if (f.endsWith(".md") || f.endsWith(".mdx"))
                return readFileSync(join(aboutDir, f), "utf-8");
        }
        return null;
    }

    // ── Words ──────────────────────────────────────────────
    if (subsetId === "words") {
        const wordsDir = join(contentRoot, "words");
        if (!existsSync(wordsDir)) return null;
        const all: string[] = [];
        for (const f of readdirSync(wordsDir)) {
            if (f.endsWith(".md") && !f.startsWith("_")) {
                all.push(readFileSync(join(wordsDir, f), "utf-8"));
            }
        }
        return all.join("\n") || null;
    }

    // ── Archives ────────────────────────────────────────────
    if (subsetId === "archives") {
        return getAllPostContent(contentRoot);
    }

    // ── Tags index ──────────────────────────────────────────
    if (subsetId === "tags") {
        return getAllTagsAndPostContent(contentRoot);
    }

    // ── Tags detail ─────────────────────────────────────────
    if (subsetId.startsWith("tags-")) {
        const tagName = decodeURIComponent(subsetId.slice(5));
        return getTagContent(contentRoot, tagName);
    }

    // ── Categories index ────────────────────────────────────
    if (subsetId === "categories") {
        return getAllCategoriesAndPostContent(contentRoot);
    }

    // ── Categories detail ───────────────────────────────────
    if (subsetId.startsWith("categories-")) {
        const catName = decodeURIComponent(subsetId.slice(11));
        return getCategoryContent(contentRoot, catName);
    }

    // ── Home page ───────────────────────────────────────────
    if (subsetId === "home") {
        return getAllConfigContent(contentRoot);
    }

    // ── Links page ──────────────────────────────────────────
    if (subsetId === "links") {
        return getAllConfigContent(contentRoot);
    }

    // ── Other HTML routes (common) ──
    // The common subset includes UI text from source + config YAML
    if (subsetId === "common") {
        return getAllConfigContent(contentRoot);
    }

    return null;
}

/** Get all config YAML content */
function getAllConfigContent(contentRoot: string): string | null {
    const configDir = join(contentRoot, "config");
    if (!existsSync(configDir)) return null;
    const all: string[] = [];
    for (const f of readdirSync(configDir)) {
        if (f.endsWith(".yml") || f.endsWith(".yaml")) {
            all.push(readFileSync(join(configDir, f), "utf-8"));
        }
    }
    return all.join("\n") || null;
}

/** Get all post content concatenated (including template/_ files) */
function getAllPostContent(contentRoot: string): string | null {
    const postsDir = join(contentRoot, "posts");
    if (!existsSync(postsDir)) return null;
    const all: string[] = [];
    for (const f of readdirSync(postsDir)) {
        if (f.endsWith(".md") || f.endsWith(".mdx")) {
            all.push(readFileSync(join(postsDir, f), "utf-8"));
        }
    }
    return all.join("\n") || null;
}

/** Get all tags + all post content */
function getAllTagsAndPostContent(contentRoot: string): string | null {
    const postContent = getAllPostContent(contentRoot);
    if (!postContent) return null;
    const tags = extractAllYamlValues(postContent, "tags");
    return postContent + " " + tags.join(" ");
}

/** Get all categories + all post content */
function getAllCategoriesAndPostContent(contentRoot: string): string | null {
    const postContent = getAllPostContent(contentRoot);
    if (!postContent) return null;
    const categories = extractAllYamlValues(postContent, "categories");
    return postContent + " " + categories.join(" ");
}

/** Get content for a specific tag: tag name + posts with that tag */
function getTagContent(contentRoot: string, tagName: string): string | null {
    const postsDir = join(contentRoot, "posts");
    if (!existsSync(postsDir)) return null;
    const all: string[] = [tagName];
    for (const f of readdirSync(postsDir)) {
        if ((f.endsWith(".md") || f.endsWith(".mdx")) && !f.startsWith("_")) {
            const content = readFileSync(join(postsDir, f), "utf-8");
            const tags = extractYamlListFromContent(content, "tags");
            if (tags.includes(tagName)) {
                all.push(content);
            }
        }
    }
    return all.join("\n") || null;
}

/** Get content for a specific category: category name + posts in that category */
function getCategoryContent(contentRoot: string, catName: string): string | null {
    const postsDir = join(contentRoot, "posts");
    if (!existsSync(postsDir)) return null;
    const all: string[] = [catName];
    for (const f of readdirSync(postsDir)) {
        if ((f.endsWith(".md") || f.endsWith(".mdx")) && !f.startsWith("_")) {
            const content = readFileSync(join(postsDir, f), "utf-8");
            const categories = extractYamlListFromContent(content, "categories");
            if (categories.includes(catName)) {
                all.push(content);
            }
        }
    }
    return all.join("\n") || null;
}

/** Extract a YAML list value from frontmatter by key */
function extractYamlListFromContent(content: string, key: string): string[] {
    const lines: string[] = [];
    const regex = new RegExp(`^${key}:$`, "m");
    const match = content.match(regex);
    if (!match) return [];
    const startIdx = match.index! + match[0].length;
    const afterKey = content.slice(startIdx);
    const listMatch = afterKey.match(/^\n((?:\s+-\s+.+\n?)*)/);
    if (!listMatch) return [];
    for (const line of listMatch[1].split("\n")) {
        const item = line.match(/^\s+-\s+(.+)/)?.[1];
        if (item) lines.push(item.trim());
    }
    return lines;
}

/** Extract all YAML list values from all posts by key */
function extractAllYamlValues(postContent: string, key: string): string[] {
    const values = new Set<string>();
    // Split by frontmatter boundaries (---)
    const parts = postContent.split(/^---$/m);
    for (let i = 1; i < parts.length; i += 2) {
        const fm = parts[i];
        const list = extractYamlListFromContent("---\n" + fm + "\n---\n", key);
        for (const v of list) values.add(v);
    }
    return [...values];
}

/**
 * Generate and serve a font subset on demand.
 * Returns the CSS content to be served.
 */
async function generateSubsetOnDemand(
    projectRoot: string,
    subsetId: string,
    logger: AstroIntegrationLogger,
): Promise<string | null> {
    const chars = getRouteChars(projectRoot, subsetId);
    if (!chars) return null;

    // Extract unique characters
    const charSet = new Set<string>();
    for (const ch of chars) charSet.add(ch);
    if (charSet.size === 0) return null;

    // Locate font file
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
    if (!fontPath) return null;

    const fontBuffer = readFileSync(fontPath);
    const outDir = resolve(projectRoot, FONT_OUT_DIR);
    mkdirSync(outDir, { recursive: true });

    // Generate subset TTF using subset-font (WASM)
    const charsStr = [...charSet].sort().join("");
    const hash = hashStr(charsStr);
    const filename = `subset-${subsetId}-${hash}.ttf`;
    const outPath = join(outDir, filename);

    if (!existsSync(outPath)) {
        try {
            const result = await subsetFont(fontBuffer, charsStr, {
                targetFormat: "sfnt",
            });
            writeFileSync(outPath, result);
            logger.info(
                `  on-demand subset: ${(result.length / 1024).toFixed(1)} KB → ${filename}`,
            );
        } catch {
            return null;
        }
    }

    return `@font-face {
    font-family: "LXGW WenKai Subset";
    src: url("/fonts/${filename}") format("truetype");
    font-display: swap;
}`;
}

/** Simple hash function for strings */
function hashStr(s: string): string {
    let hash = 0;
    for (let i = 0; i < s.length && i < 100; i++) {
        const ch = s.charCodeAt(i);
        hash = (hash << 5) - hash + ch;
        hash |= 0;
    }
    return Math.abs(hash).toString(36).slice(0, 8);
}

/**
 * Create Vite middleware for on-demand font subsetting in dev mode.
 */
export function createDevFontMiddleware(projectRoot: string, logger: AstroIntegrationLogger) {
    return async (req: any, res: any, next: any) => {
        const url = req.url || "";
        const pathname = url.split("?")[0].split("#")[0];
        const match = pathname.match(/^\/fonts\/subset-(.+)\.css$/);
        if (!match) return next();

        const subsetId = match[1];

        // Check if file already exists (cached from previous on-demand generation)
        const cssPath = resolve(projectRoot, FONT_OUT_DIR, `subset-${subsetId}.css`);
        if (existsSync(cssPath)) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/css");
            res.end(readFileSync(cssPath, "utf-8"));
            return;
        }

        // Generate on-demand
        logger.info(`Font subset: on-demand generating for "${subsetId}"...`);
        const css = await generateSubsetOnDemand(projectRoot, subsetId, logger);
        if (css) {
            writeFileSync(cssPath, css); // cache it
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/css");
            res.end(css);
        } else {
            next();
        }
    };
}
