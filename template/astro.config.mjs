import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import { mermaidMdast, mermaidHast } from "@xingwangzhe/satteri-mermaid";
import { photoswipe } from "@xingwangzhe/satteri-photoswipe";
import expressiveCode from "astro-expressive-code";
import { defineConfig } from "astro/config";
import stalux from "stalux";

// https://astro.build/config
export default defineConfig({
    output: "static",
    site: "https://example.com",
    prefetch: {
        prefetchAll: false,
        defaultStrategy: "hover",
    },
    integrations: [
        // Stalux 主题集成 — 自动注入所有页面、组件、路由
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
