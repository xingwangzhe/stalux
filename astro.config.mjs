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
import { config_site } from './src/utils/config-adapter';
import pagefind from "astro-pagefind";
// 数学公式渲染相关插件
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import timestampIntegration from './src/integrations/timestamp-integration.mjs';
// https://astro.build/config
export default defineConfig({
  build: {
    format: "directory",
  }, site: config_site.url,
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
    }),], vite: {
      css: {
        transformer: "lightningcss",
        lightningcss: {
          targets: browserslistToTargets(browserslist('>= 0.25%'))
        }
      },        // 处理可能不存在的_config.ts文件
      plugins: [
        {
          name: 'handle-optional-imports',
          resolveId(id, importer) {
            // 捕获对 _config.ts 的导入
            if (id.includes('/_config') || id.endsWith('_config')) {
              try {
                // 检查文件是否实际存在
                const fs = require('fs');
                const path = require('path');
                const configPath = path.resolve('./src/_config.ts');

                if (fs.existsSync(configPath)) {
                  // 如果存在，让 Vite 正常处理
                  return null;
                }

                // 如果文件不存在，返回虚拟模块路径
                return '\0virtual:_config';
              } catch (e) {
                // 如果出错，返回虚拟模块
                return '\0virtual:_config';
              }
            }
            return null;
          },
          load(id) {
            // 为虚拟模块提供默认导出
            if (id === '\0virtual:_config') {
              return 'export const useConfig = false; export const siteConfig = {};';
            }
            return null;
          }
        }
      ],
      build: {
        cssMinify: 'lightningcss',          // 让 Vite/Rollup 静默处理一些导入错误
        rollupOptions: {
          onwarn(warning, warn) {
            // 忽略关于找不到_config模块的警告
            if (
              warning.code === 'UNRESOLVED_IMPORT' &&
              warning.message && warning.message.includes('_config')
            ) {
              return;
            }
            // 传递其他警告
            warn(warning);
          }
        }
      }
    },
  // 禁用开发工具栏
  devToolbar: {
    enabled: false,
  }, markdown: {
    remarkPlugins: [remarkModifiedTime, remarkModifiedAbbrlink, [remarkToc, { heading: "contents" }], remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});