import path from "node:path";
import { fileURLToPath } from "node:url";

import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { mermaidMdast, mermaidHast } from "@xingwangzhe/satteri-mermaid";
import { photoswipe } from "@xingwangzhe/satteri-photoswipe";
import expressiveCode from "astro-expressive-code";
// @ts-check
import { defineConfig, fontProviders } from "astro/config";

// 使用本地 stalux 集成（注入路由、Vite 别名、Pagefind 等）
import stalux from "./src/index.ts";
import { featureFlagsHast, featureFlagsMdast } from "./src/plugins/feature-flags.ts";
import { temml } from "./src/plugins/satteri-temml.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const site = "https://stalux.needhelp.icu";

import fs from "node:fs";

// 预计算薄标签（< 3 篇文章）的 URL 集合，用于 sitemap 过滤
function computeThinTagUrls() {
    const postsDir = path.resolve(__dirname, "stalux/posts");
    const tagCounts = {};
    if (fs.existsSync(postsDir)) {
        for (const file of fs.readdirSync(postsDir)) {
            const content = fs.readFileSync(path.join(postsDir, file), "utf-8");
            const tagsMatch = content.match(/^tags:\s*(\[[^\]]*\]|[\s\S]*?)(?=^\S|\n---)/m);
            if (tagsMatch) {
                let tagsStr = tagsMatch[1].trim();
                // inline array: [tag1, tag2]
                if (tagsStr.startsWith("[")) {
                    tagsStr = tagsStr.slice(1, -1);
                }
                const tags = tagsStr
                    .split("\n")
                    .map((l) =>
                        l
                            .replace(/^\s*-\s*/, "")
                            .trim()
                            .replace(/^["']|["']$/g, ""),
                    )
                    .filter(Boolean);
                for (const tag of tags) {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                }
            }
        }
    }
    const thinTags = new Set(
        Object.entries(tagCounts)
            .filter(([, c]) => c < 3)
            .map(([t]) => t),
    );
    const thinUrls = new Set();
    for (const tag of thinTags) {
        thinUrls.add(`${site}/tags/${encodeURIComponent(tag)}/`);
    }
    return thinUrls;
}

const thinTagUrls = computeThinTagUrls();

// https://astro.build/config
export default defineConfig({
    output: "static",
    site: site,
    experimental: {
        collectionStorage: "chunked",
    },
    prefetch: {
        prefetchAll: false,
        defaultStrategy: "hover",
    },
    fonts: [
        {
            provider: fontProviders.local(),
            name: "Google Sans Code",
            cssVariable: "--font-code",
            options: {
                variants: [
                    {
                        weight: "100 900",
                        style: "normal",
                        src: ["./src/assets/fonts/GoogleSansCode.woff2"],
                    },
                    {
                        weight: "100 900",
                        style: "italic",
                        src: ["./src/assets/fonts/GoogleSansCode-Italic.woff2"],
                    },
                ],
            },
        },
    ],
    integrations: [
        // Stalux 主题集成（注入路由、Vite 别名、全局 CSS、Pagefind 等）
        stalux({
            contentDir: "stalux",
            pagefind: true,
            devToolbar: true,
        }),

        sitemap({
            filter: (page) => {
                // 不把 Markdown 源码端点（/posts/*.md）写入 sitemap
                if (page.endsWith(".md")) return false;
                // 排除薄标签页（< 3 篇文章）
                if (thinTagUrls.has(page)) return false;
                return (
                    page.includes("/posts/") ||
                    page.includes("/about/") ||
                    page.includes("/links/") ||
                    page.includes("/words/") ||
                    page === site + "/" ||
                    page === site + "/archives/" ||
                    page.includes("/tags/") ||
                    page.includes("/categories/")
                );
            },
            lastmod: new Date(),
        }),
        expressiveCode({
            // 代码块默认显示行号（@expressive-code/plugin-line-numbers）
            plugins: [pluginLineNumbers()],
            themes: ["dark-plus", "github-light"],
            styleOverrides: {
                borderRadius: "0.5rem",
                codeFontFamily:
                    'var(--font-code), "JetBrains Mono", "Fira Code", "Consolas", "Courier New", monospace',
                frames: {
                    shadowColor: "#124",
                },
            },
            // 性能优化选项
            useDarkModeMediaQuery: true,
            minSyntaxHighlightingColorContrast: 5.5,
            defaultProps: {
                wrap: true,
                overridesByLang: {
                    "bash,ps,sh": { preserveIndent: false },
                },
            },
        }),
    ],
    markdown: {
        processor: satteri({
            features: {
                math: true,
                smartPunctuation: true,
                gfm: true,
                frontmatter: true,
            },
            mdastPlugins: [temml(), mermaidMdast(), featureFlagsMdast],
            hastPlugins: [
                photoswipe(),
                mermaidHast({
                    responsive: true,
                    theme: "dark",
                    themeOverrides: {
                        clusterBorder: "#cccccc",
                    },
                }),
                featureFlagsHast,
            ],
        }),
    },
});
