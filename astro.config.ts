// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import browserslist from "browserslist";
import vue from "@astrojs/vue";
import astroExpressiveCode from "astro-expressive-code";
import { remarkModifiedTime } from "./src/integrations/remark-modified-time.ts";
import { remarkModifiedAbbrlink } from "./src/integrations/remark-modified-abbrlink.ts";
import remarkToc from "remark-toc";
import { browserslistToTargets } from "lightningcss";
import { config_site } from "./src/utils/yaml-config-adapter";
import pagefind from "astro-pagefind";
// 数学公式渲染相关插件
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import timestampIntegration from "./src/integrations/timestamp-integration.ts";
// https://astro.build/config
import yaml from "@rollup/plugin-yaml";
import getReadingTime from "reading-time";
import { toString } from "mdast-util-to-string";
import { remarkReadingTime } from "./src/integrations/remark-reading-time.ts";
export default defineConfig({
  build: {
    format: "directory",
    inlineStylesheets: "auto", // 自动内联小 CSS 文件
    assets: "_astro", // 统一资源目录
  },

  // 实验性功能
  experimental: {
    contentIntellisense: true, // 内容智能感知
  },

  // 图片优化配置
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
    remotePatterns: [],
  },

  // 预获取配置 - 提升页面切换速度
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
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
        targets: browserslistToTargets(browserslist("> 0.5%, not dead")),
      },
    },
    build: {
      cssMinify: "lightningcss",
      minify: "esbuild", // 使用 esbuild 进行 JS 压缩
      sourcemap: false, // 生产环境关闭 sourcemap
      target: "es2022", // 现代 JS 目标
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
