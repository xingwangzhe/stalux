// @ts-check
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";
import readingTime from "astro-reading-time";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import astroLLMsGenerator from "astro-llms-generate";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypePhotoswipe from "./src/utils/rehype-photoswipe";
import mermaid from "astro-mermaid";

// import rehypePhotoswipe from "./src/utils/rehype-photoswipe";
import expressiveCode from "astro-expressive-code";

if (process.env.NODE_ENV === "production" || process.argv.includes("build")) {
  const originalError = console.error;
  console.error = function (...args) {
    const message = args[0]?.toString?.() || "";
    if (message.includes("Could not parse CSS stylesheet")) {
      return;
    }
    originalError.apply(console, args);
  };
}

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://stalux.needhelp.icu",
  experimental: {
    preserveScriptOrder: true,
  },
  integrations: [
    mermaid({
      theme: "dark",
      autoTheme: true,
    }),
    readingTime(),
    pagefind(),
    sitemap({
      filter: (page) => {
        // 排除 API 端点和 404 页面
        return !page.includes("/api/") && !page.includes("/404");
      },
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
    }),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
    astroLLMsGenerator({
      includePatterns: ["**/*"], // Pages to include
      excludePatterns: ["**/404*", "**/api/**"], // Pages to exclude
      customSeparator: "\n\n---\n\n", // Custom separator for full content
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
    build: {
      cssMinify: "lightningcss",
      target: "es2022",
      sourcemap: false,
    },
  },
  markdown: {
    remarkPlugins: [[remarkToc, { heading: "toc", maxDepth: 7 }], remarkMath],
    rehypePlugins: [rehypeKatex, rehypePhotoswipe],
    smartypants: true, // 智能标点符号
    gfm: true, // GitHub 风格的 Markdown 支持
  },
});
