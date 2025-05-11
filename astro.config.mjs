// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import browserslist from 'browserslist';
import vue from '@astrojs/vue';
import astroExpressiveCode from 'astro-expressive-code'
import {remarkModifiedTime} from './src/utils/remark-modified-time.mjs';
import { remarkModifiedAbbrlink } from './src/utils/remark-modified-abbrlink.mjs';
import remarkToc from 'remark-toc';
import {browserslistToTargets} from 'lightningcss';
import { config_site } from './src/utils/config-adapter';
import pagefind from "astro-pagefind";
// 数学公式渲染相关插件
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
// https://astro.build/config
export default defineConfig({
    build: {
      format: "directory",
    },    site: config_site.url,
    integrations: [
      pagefind(),
      sitemap({
        filter: (page) => {
          // 只包含首页、posts、about页面
          return page.includes('/posts/') || 
                 page === config_site.url + '/about' || 
                 page === config_site.url + '/';
        },
        changefreq: 'weekly',
        priority: 0.7,
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
        css: {
          transformer: "lightningcss",
          lightningcss: {
            targets: browserslistToTargets(browserslist('>= 0.25%'))
          }
        },
        build: {
          cssMinify: 'lightningcss'
        }
    },
    // 禁用开发工具栏
    devToolbar: {
        enabled: false,
    },    markdown: {
      remarkPlugins: [remarkModifiedTime,remarkModifiedAbbrlink,[remarkToc, { heading: "contents"} ], remarkMath],
      rehypePlugins: [rehypeKatex],
    },
});