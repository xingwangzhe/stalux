// @ts-check
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypePhotoswipe from "./src/utils/rehype-photoswipe";
import { remarkPostBody } from "./src/utils/remark-post-body";

import expressiveCode from "astro-expressive-code";

const site = "https://xingwangzhe.fun";
// https://astro.build/config
export default defineConfig({
    output: "static",
    site: site,
    experimental: {
        rustCompiler: false,
        queuedRendering: {
            enabled: true,
            contentCache: true,
            poolSize: 3000,
        },
    },
    build: {
        concurrency: 10,
    },
    integrations: [
        pagefind(),
        sitemap({
            filter: (page) => {
                return (
                    page.includes("/posts/") ||
                    page.includes("/about/") ||
                    page.includes("/links/") ||
                    page === site + "/" ||
                    page === site + "/archives/" ||
                    page.includes("/tags/") ||
                    page.includes("/categories/")
                );
            },
            lastmod: new Date(),
        }),
        expressiveCode({
            themes: ["dark-plus", "github-light"],
            styleOverrides: {
                borderRadius: "0.5rem",
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
    vite: {
        define: {
            // Vue feature flags for Waline
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
        },
        build: {
            cssMinify: "lightningcss",
            target: "es2022",
            sourcemap: false,
        },
    },
    markdown: {
        remarkPlugins: [remarkPostBody, remarkMath],
        rehypePlugins: [[rehypeKatex, { strict: false }], rehypePhotoswipe],
        smartypants: true, // 智能标点符号
        gfm: true, // GitHub 风格的 Markdown 支持
    },
});
