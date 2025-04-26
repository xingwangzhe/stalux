// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import viteImagemin from "vite-plugin-imagemin";
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
    site: 'https://example.com',
    integrations: [mdx(), sitemap(), vue(),
      viteImagemin({
        gifsicle: {
          optimizationLevel: 7, // 设置 gif 压缩级别
          interlaced: false
        },
        // 无损压缩配置，无损压缩下图片质量不会变差
        optipng: {
          optimizationLevel: 7 // 设置 png 压缩级别
        },
        mozjpeg: {
          quality: 20 // 设置 jpg 压缩质量
        },
        // 有损压缩配置，有损压缩下图片质量可能会变差
        pngquant: {
          quality: [0.8, 0.9], // 设置 png 压缩质量范围
          speed: 4
        },
        // svg 优化
        svgo: {
          plugins: [
            {
              name: "removeViewBox"
            },
            {
              name: "removeEmptyAttrs",
              active: false
            }
          ]
        }
      })
    ],
    vite: {
        css: {
          transformer: "lightningcss",
        },
      },
});