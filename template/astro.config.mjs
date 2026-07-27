import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import { mermaidHast } from "@xingwangzhe/satteri-mermaid";
import { photoswipe } from "@xingwangzhe/satteri-photoswipe";
import stalux from "@xingwangzhe/stalux";
import expressiveCode from "astro-expressive-code";
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
    output: "static",
    site: "https://example.com",
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
                        src: [
                            "./node_modules/@xingwangzhe/stalux/src/assets/fonts/GoogleSansCode.woff2",
                        ],
                    },
                    {
                        weight: "100 900",
                        style: "italic",
                        src: [
                            "./node_modules/@xingwangzhe/stalux/src/assets/fonts/GoogleSansCode-Italic.woff2",
                        ],
                    },
                ],
            },
        },
    ],
    integrations: [
        stalux({
            contentDir: "stalux",
        }),
        sitemap(),
        expressiveCode({
            themes: ["dark-plus", "github-light"],
            styleOverrides: {
                borderRadius: "0.5rem",
                codeFontFamily:
                    '"JetBrains Mono", "Fira Code", "Consolas", "Courier New", monospace',
            },
            useDarkModeMediaQuery: true,
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
            mdastPlugins: [],
            hastPlugins: [
                photoswipe(),
                mermaidHast({
                    responsive: true,
                    theme: "dark",
                }),
            ],
        }),
    },
});
