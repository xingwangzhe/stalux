// @ts-check
import { defineConfig } from "astro/config";

// 使用本地 stalux 集成（注入路由、Vite 别名、Pagefind、satteri 插件等）
import stalux from "./src/index.ts";

const site = "https://stalux.needhelp.icu";

// https://astro.build/config
export default defineConfig({
    output: "static",
    site: site,
    experimental: {
        collectionStorage: "chunked",
        // 增量静态构建：未变化的 getStaticPaths 页面直接复用上次输出，大幅缩短构建时间
        incrementalBuild: true,
    },
    prefetch: {
        prefetchAll: false,
        defaultStrategy: "hover",
    },
    // sitemap / expressive-code / markdown 插件（math、photoswipe、mermaid、字数统计、特性标记）
    // 均由 stalux 集成打包注入，这里只透传自定义选项。
    integrations: [
        stalux({
            contentDir: "stalux",
            pagefind: true,
            devToolbar: true,
            sitemap: {
                filter: (page) => {
                    // 不把 Markdown 源码端点（/posts/*.md）写入 sitemap
                    if (page.endsWith(".md")) return false;
                    return (
                        page.includes("/posts/") ||
                        page.includes("/about/") ||
                        page.includes("/links/") ||
                        page.includes("/words/") ||
                        page === `${site}/` ||
                        page === `${site}/archives/` ||
                        page.includes("/tags/") ||
                        page.includes("/categories/")
                    );
                },
            },
            expressiveCode: {
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
            },
        }),
    ],
});
