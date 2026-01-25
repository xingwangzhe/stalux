// @ts-check
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";
import readingTime from "astro-reading-time";
import partytown from "@astrojs/partytown";
import vue from "@astrojs/vue";
import remarkToc from "remark-toc";
import astroLLMsGenerator from "astro-llms-generate";

// Suppress jsdom CSS parsing errors from pagefind
if (process.env.NODE_ENV === "production" || process.argv.includes("build")) {
  const originalError = console.error;
  console.error = function(...args) {
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
  experimental: {
    preserveScriptOrder: true,
  },
  integrations: [
    vue(),
    readingTime(),
    pagefind(),
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
  ],
  vite: {
    build: {
      cssMinify: "lightningcss",
      target: "es2022",
    },
  },
  markdown: {
    remarkPlugins: [[remarkToc, { heading: "toc", maxDepth: 7 }]],
    // rehypePlugins: [rehypeAccessibleEmojis],
  },
});
