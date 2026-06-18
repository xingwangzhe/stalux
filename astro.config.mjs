import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";
import pagefind from "astro-pagefind";
// @ts-check
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { katex } from "@nullpinter/satteri-katex";



import { featurePlugin } from "./src/utils/satteri-mermaid";
import { photoswipePlugin } from "./src/utils/satteri-photoswipe";


const site = "https://stalux.needhelp.icu";
// https://astro.build/config
export default defineConfig({
    output: "static",
    site: site,
    experimental: {},
    integrations: [
        pagefind(),
        sitemap({
            filter: (page) => {
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
            minify: "oxc",
            cssMinify: "lightningcss",
            target: "esnext",
            sourcemap: false,
            chunkSizeWarningLimit: 1000,
        },
    },
    markdown: {
        processor: satteri({
            features: {
                math: true,
                smartPunctuation: true,
                gfm: true,
            },
            mdastPlugins: [katex(), featurePlugin],
            hastPlugins: [photoswipePlugin],
        }),
    },
});
