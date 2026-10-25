// @ts-check

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import UnoCSS from "@unocss/astro";
import { defineConfig } from "astro/config";
import Sonda from "sonda/vite";
import { parse as parseYaml } from "yaml";

// 使用本地 stalux 集成（注入路由、Vite 别名、Pagefind、satteri 插件等）
import stalux from "./src/index.ts";

const site = "https://stalux.needhelp.icu";
const promotePath = path.join(process.cwd(), "stalux/config/promote.yml");
const promoteConfig = existsSync(promotePath)
    ? (parseYaml(readFileSync(promotePath, "utf8")) as { export_md?: boolean } | undefined)
    : undefined;
const exportMarkdown = promoteConfig?.export_md === true;

// 包体积分析：仅当显式设置 SONDA=1 时生成 .sonda 报告，日常构建不做额外分析。
const analyzeBundle = process.env.SONDA === "1";

// https://astro.build/config
export default defineConfig({
    output: "static",
    site,
    experimental: {
        collectionStorage: "chunked",
        // 增量静态构建：未变化的 getStaticPaths 页面直接复用上次输出，大幅缩短构建时间
        incrementalBuild: true,
    },
    prefetch: {
        prefetchAll: false,
        defaultStrategy: "hover",
    },
    // 仅在包体积分析时生成 sourcemap，让 Sonda 还原真实模块体积。
    vite: {
        build: { sourcemap: analyzeBundle },
        // 包体积分析报告按需开启（bun run analyze）。
        // 只统计客户端产物（dist/_astro）：pre-render 服务端 bundle 与线上传输体积无关，
        // 且 Astro 会先后跑两趟构建（静态入口 + 客户端），同一报告文件会被两趟结果互相覆盖。
        ...(analyzeBundle
            ? {
                  plugins: [
                      Sonda({
                          include: [/^dist\/_astro\//],
                          format: ["html", "json"],
                          filename: "sonda",
                          outputDir: ".sonda",
                          open: false,
                          gzip: true,
                          brotli: true,
                      }),
                  ],
              }
            : {}),
    },
    // sitemap / expressive-code / markdown 插件（math、photoswipe、mermaid、字数统计、特性标记）
    // 均由 stalux 集成打包注入，这里只透传自定义选项。
    integrations: [
        UnoCSS({ injectReset: false, injectEntry: false }),
        stalux({
            contentDir: "stalux",
            pagefind: true,
            devToolbar: true,
            sitemap: {
                filter: (page) => {
                    return (
                        (exportMarkdown || !new URL(page).pathname.endsWith(".md")) &&
                        (page.includes("/posts/") ||
                            page.includes("/about/") ||
                            page.includes("/links/") ||
                            page.includes("/words/") ||
                            page === `${site}/` ||
                            page === `${site}/archives/` ||
                            page.includes("/tags/") ||
                            page.includes("/categories/"))
                    );
                },
            },
            expressiveCode: {
                themes: ["dark-plus"],
                themeCssSelector: false,
                styleOverrides: {
                    borderRadius: "0.5rem",
                    codeFontFamily:
                        'var(--font-code), "JetBrains Mono", "Fira Code", "Consolas", "Courier New", monospace',
                    frames: {
                        shadowColor: "#124",
                    },
                },
                // 性能优化选项
                useDarkModeMediaQuery: false,
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
