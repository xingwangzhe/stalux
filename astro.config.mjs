import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import { katex } from "@nullpinter/satteri-katex";
import { photoswipe } from "@xingwangzhe/satteri-photoswipe";
import expressiveCode from "astro-expressive-code";
// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import { featureFlagsHast, featureFlagsMdast, mermaidHast } from "./src/plugins/feature-flags.ts";

const site = "https://xingwangzhe.fun";
// https://astro.build/config
export default defineConfig({
    output: "static",
    site: site,
    experimental: {},
    fonts: [
        {
            provider: fontProviders.local(),
            name: "LXGW WenKai",
            cssVariable: "--font-body",
            options: {
                variants: [
                    {
                        weight: 400,
                        style: "normal",
                        src: ["./src/assets/fonts/LXGWWenKai-Regular.woff2"],
                    },
                ],
            },
        },
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
        // astro-expressive-code 0.43.1 auto-detects Sätteri and uses its HAST pipeline
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
                smartPunctuation: false,
                gfm: true,
                frontmatter: true,
            },
            mdastPlugins: [katex(), featureFlagsMdast],
            hastPlugins: [photoswipe(), featureFlagsHast, mermaidHast],
        }),
    },
});
