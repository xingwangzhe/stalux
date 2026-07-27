/**
 * Dev mode on-demand font subsetting middleware.
 *
 * Intercepts /fonts/subset-*.css requests, generates the WOFF2 subset
 * for the requested route on-the-fly, and serves it.
 *
 * Hooked into astro:server:setup.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegrationLogger } from "astro";
import subsetFontFn from "subset-font";

const FONT_INPUT = "src/assets/fonts/LXGWWenKai-Regular.ttf";
const CONTENT_ROOT = "stalux";
const FONT_OUT_DIR = "public/fonts";

/** Map route-style subset ID → content file path */
function resolveContentFile(projectRoot: string, subsetId: string): string | null {
  if (subsetId === "home") return null; // home has no specific content
  if (subsetId === "about") {
    const aboutDir = resolve(projectRoot, CONTENT_ROOT, "about");
    if (!existsSync(aboutDir)) return null;
    for (const f of readdirSync(aboutDir)) {
      if (f.endsWith(".md") || f.endsWith(".mdx")) return join(aboutDir, f);
    }
    return null;
  }
  if (subsetId === "words") {
    const wordsDir = resolve(projectRoot, CONTENT_ROOT, "words");
    if (!existsSync(wordsDir)) return null;
    // Aggregate all words files
    return wordsDir; // special: aggregate all
  }
  if (subsetId.startsWith("posts-")) {
    const abbrlink = subsetId.slice(6);
    const postsDir = resolve(projectRoot, CONTENT_ROOT, "posts");
    if (!existsSync(postsDir)) return null;
    for (const f of readdirSync(postsDir)) {
      if ((f.endsWith(".md") || f.endsWith(".mdx")) && !f.startsWith("_")) {
        const content = readFileSync(join(postsDir, f), "utf-8");
        if (content.includes(`abbrlink: ${abbrlink}`)) return join(postsDir, f);
      }
    }
    return null;
  }
  return null;
}

/** Extract unique characters from file content */
function extractChars(text: string): string {
  const set = new Set<string>();
  for (const ch of text) set.add(ch);
  return [...set].sort().join("");
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
  // 1. Resolve content file
  const contentPath = resolveContentFile(projectRoot, subsetId);
  if (!contentPath) return null;

  // 2. Read content + extract chars
  let content: string;
  if (contentPath.endsWith("words")) {
    // aggregate all words
    const allWords: string[] = [];
    for (const f of readdirSync(contentPath)) {
      if (f.endsWith(".md") && !f.startsWith("_")) {
        allWords.push(readFileSync(join(contentPath, f), "utf-8"));
      }
    }
    content = allWords.join("\n");
  } else {
    content = readFileSync(contentPath, "utf-8");
  }

  const chars = extractChars(content);

  // 3. Load common subset chars to find unique ones
  const outDir = resolve(projectRoot, FONT_OUT_DIR);
  const commonCSS = join(outDir, "common.css");
  let commonCharsCached: string[] = [];

  // Look for existing common subset to extract its covered chars
  // We re-read the common subset data from the generated file list
  const commonFile = existsSync(join(outDir, "common.css"))
    ? readFileSync(join(outDir, "common.css"), "utf-8")
    : "";
  // We can't know exactly what chars the common subset covers without reading
  // the original source. But we can just generate the full subset.
  // To minimize size, we note that common subset already covers most.

  // 4. Locate font file
  const fontPaths = [
    resolve(projectRoot, FONT_INPUT),
    resolve(projectRoot, "node_modules", "@xingwangzhe", "stalux", FONT_INPUT),
    resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", FONT_INPUT),
  ];
  let fontPath: string | undefined;
  for (const p of fontPaths) {
    if (existsSync(p)) { fontPath = p; break; }
  }
  if (!fontPath) return null;

  const fontBuffer = readFileSync(fontPath);
  mkdirSync(outDir, { recursive: true });

  // 5. Generate subset WOFF2
  const hash = [...chars].slice(0, 12).join("");
  const filename = `subset-${subsetId}-${hash}.woff2`;
  const outPath = join(outDir, filename);

  if (!existsSync(outPath)) {
    const data = await subsetFontFn(fontBuffer, chars, { targetFormat: "woff2" });
    writeFileSync(outPath, data);
    logger.info(`  on-demand subset: ${(data.length / 1024).toFixed(1)} KB → ${filename}`);
  }

  // 6. Return CSS content
  return `@font-face {
    font-family: "LXGW WenKai Subset";
    src: url("/fonts/${filename}") format("woff2");
    font-display: swap;
}`;
}

/**
 * Create Vite middleware for on-demand font subsetting in dev mode.
 */
export function createDevFontMiddleware(projectRoot: string, logger: AstroIntegrationLogger) {
  return async (req: any, res: any, next: any) => {
    const url = req.url || "";
    const match = url.match(/^\/fonts\/subset-(.+)\.css$/);
    if (!match) return next();

    const subsetId = match[1];

    // Check if file already exists
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
      // Cache it
      writeFileSync(cssPath, css);
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/css");
      res.end(css);
    } else {
      next();
    }
  };
}
