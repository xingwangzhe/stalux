// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import browserslist from 'browserslist';
import vue from '@astrojs/vue';
import astroExpressiveCode from 'astro-expressive-code';
import { remarkModifiedTime } from './src/integrations/remark-modified-time.mjs';
import { remarkModifiedAbbrlink } from './src/integrations/remark-modified-abbrlink.mjs';
import remarkToc from 'remark-toc';
import { browserslistToTargets } from 'lightningcss';
import { config_site } from './src/utils/yaml-config-adapter';
import pagefind from "astro-pagefind";
// 数学公式渲染相关插件
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import timestampIntegration from './src/integrations/timestamp-integration.mjs';
// https://astro.build/config
import yaml from '@rollup/plugin-yaml';
import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';
import { remarkReadingTime } from './src/integrations/remark-reading-time.mjs';
export default defineConfig({
  build: {
    format: "directory",
  }, 
  site: config_site.url,
  integrations: [
    timestampIntegration(),
    pagefind(),
    sitemap({
      filter: (page) => {
        // 包含所有重要页面及其子页面
        return page.includes('/posts/') ||
          page.includes('/about/') ||
          page.includes('/links/') ||
          page === config_site.url + '/' ||
          page === config_site.url + '/archives/' ||
          page === config_site.url + '/tags/' ||
          page === config_site.url + '/categories/' ||
          page.includes('/tags/') ||      // 所有标签页面
          page.includes('/categories/');  // 所有分类页面
      },
      changefreq: 'weekly',
      priority: 0.5,
      lastmod: new Date()
    }),
    vue(),
    astroExpressiveCode({
      // You can set configuration options here
      themes: ['dark-plus', 'github-light'],
      styleOverrides: {
        // You can also override styles
        borderRadius: '0.5rem',
        frames: {
          shadowColor: '#124',
        },
      },
    }),], 
    vite: {
       plugins: [yaml()],
      css: {
        transformer: "lightningcss",
        lightningcss: {
          targets: browserslistToTargets(browserslist('>= 0.25%'))
        }
      },        // 处理可能不存在的_config.ts文件
      build: {
        cssMinify: 'lightningcss',          // 让 Vite/Rollup 静默处理一些导入错误
        rollupOptions: {}
      }
    },
  // 禁用开发工具栏
  devToolbar: {
    enabled: false,
  }, 
  markdown: {
    remarkPlugins: [
      remarkModifiedTime,
      remarkModifiedAbbrlink,
      remarkReadingTime,
      [remarkToc, { heading: "contents" }],
      remarkMath
    ],
    rehypePlugins: [rehypeKatex],
  },
});