// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import browserslist from "browserslist";
import vue from "@astrojs/vue";
import astroExpressiveCode from "astro-expressive-code";
import { remarkModifiedTime } from "./src/integrations/remark-modified-time.mjs";
import { remarkModifiedAbbrlink } from "./src/integrations/remark-modified-abbrlink.mjs";
import remarkToc from "remark-toc";
import { browserslistToTargets } from "lightningcss";
import { config_site } from "./src/utils/yaml-config-adapter";
import pagefind from "astro-pagefind";
// 数学公式渲染相关插件
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import timestampIntegration from "./src/integrations/timestamp-integration.mjs";
// https://astro.build/config
import yaml from "@rollup/plugin-yaml";
import getReadingTime from "reading-time";
import { toString } from "mdast-util-to-string";
import { remarkReadingTime } from "./src/integrations/remark-reading-time.mjs";
export default defineConfig({
  build: {
    format: "directory",
    inlineStylesheets: "auto", // 自动内联小 CSS 文件
  },

  // 实验性功能
  experimental: {
    contentIntellisense: true, // 内容智能感知
  },

  site: config_site.url,
  integrations: [
    timestampIntegration(),

    // Pagefind 搜索
    pagefind(),

    // Sitemap 优化
    sitemap({
      filter: (page) => {
        // 包含所有重要页面及其子页面
        return (
          page.includes("/posts/") ||
          page.includes("/about/") ||
          page.includes("/links/") ||
          page === config_site.url + "/" ||
          page === config_site.url + "/archives/" ||
          page === config_site.url + "/tags/" ||
          page === config_site.url + "/categories/" ||
          page.includes("/tags/") || // 所有标签页面
          page.includes("/categories/")
        ); // 所有分类页面
      },
      changefreq: "weekly",
      priority: 0.5,
      lastmod: new Date(),
      // 添加性能优化
      serialize(item) {
        return {
          url: item.url,
          changefreq: item.changefreq,
          lastmod: item.lastmod,
          priority: item.priority,
          links: item.links,
        };
      },
    }),

    // Vue 集成优化
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("astro-"),
        },
      },
    }),

    // 代码高亮优化
    astroExpressiveCode({
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
    plugins: [yaml()],
    css: {
      transformer: "lightningcss",
      lightningcss: {
        targets: browserslistToTargets(browserslist(">= 0.25%")),
      },
    },
    build: {
      cssMinify: "lightningcss",
      minify: "esbuild", // 使用 esbuild 进行 JS 压缩
      sourcemap: false, // 生产环境关闭 sourcemap
      rollupOptions: {
        output: {
          // 手动代码分割策略
          manualChunks(id) {
            // 将 node_modules 按功能分组
            if (id.includes("node_modules")) {
              if (id.includes("vue")) {
                return "vue";
              }
              if (id.includes("@fancyapps")) {
                return "fancybox";
              }
              if (id.includes("animejs")) {
                return "anime";
              }
              if (id.includes("dayjs")) {
                return "dayjs";
              }
              if (id.includes("katex")) {
                return "katex";
              }
              if (id.includes("reading-time") || id.includes("gray-matter")) {
                return "utils";
              }
              return "vendor";
            }

            // 将组件按功能分组
            if (id.includes("src/components/comments")) {
              return "comments";
            }
            if (id.includes("src/scripts")) {
              return "scripts";
            }
          },
          // 优化输出文件名
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
      // 提高构建性能
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false, // 生产环境关闭压缩大小报告
    },
    // 优化依赖预构建
    optimizeDeps: {
      include: ["vue", "dayjs", "animejs", "@fancyapps/ui"],
      exclude: ["astro:transitions"],
    },
    // 开发服务器优化
    server: {
      hmr: {
        overlay: false, // 关闭错误覆盖层
      },
    },
  },
  // 禁用开发工具栏
  devToolbar: {
    enabled: false,
  },

  // 性能优化
  output: "static",

  markdown: {
    remarkPlugins: [
      remarkModifiedTime,
      remarkModifiedAbbrlink,
      remarkReadingTime,
      [remarkToc, { heading: "contents", maxDepth: 3 }], // 限制目录深度
      remarkMath,
    ],
    rehypePlugins: [rehypeKatex],
    // 优化 markdown 处理
    shikiConfig: {
      wrap: true,
    },
    gfm: true, // 启用 GitHub Flavored Markdown
    smartypants: true, // 智能标点符号
  },
});
