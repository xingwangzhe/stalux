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
// https://astro.build/config
export default defineConfig({
    site: config_site.url,
    integrations: [sitemap(), vue(),astroExpressiveCode({
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
    },
    markdown: {
      remarkPlugins: [remarkModifiedTime,remarkModifiedAbbrlink,[remarkToc, { heading: "contents"} ]],
    },
});