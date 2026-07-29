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

    // ── Other HTML routes (home, archives, tags, categories, links, 404) ──
    // These pages use i18n text + config YAML text, which are already
    // covered by the common subset. Return config text for extra safety.
    if (["home", "archives", "tags", "categories", "links", "common"].includes(subsetId)) {
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

    return null;
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
