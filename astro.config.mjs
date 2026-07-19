import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import { katex } from "@nullpinter/satteri-katex";
import { mermaidMdast, mermaidHast } from "@xingwangzhe/satteri-mermaid";
import { photoswipe } from "@xingwangzhe/satteri-photoswipe";
import expressiveCode from "astro-expressive-code";
// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import Font from "vite-plugin-font";

import { featureFlagsHast, featureFlagsMdast } from "./src/plugins/feature-flags.ts";

const site = "https://stalux.needhelp.icu";
// https://astro.build/config
export default defineConfig({
    output: "static",
    site: site,
    experimental: {
        collectionStorage: "chunked",
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
        sitemap({
            filter: (page) => {
                // 不把 Markdown 源码端点（/posts/*.md）写入 sitemap
                if (page.endsWith(".md")) return false;
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
    vite: {
        plugins: [
            Font.vite({
                scanFiles: ["src/**/*.{astro,ts,js,md,mdx}"],
            }),
        ],
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
                frontmatter: true,
            },
            mdastPlugins: [katex(), mermaidMdast(), featureFlagsMdast],
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
