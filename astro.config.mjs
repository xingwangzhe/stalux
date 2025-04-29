// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
    // 站点URL，用于生成sitemap和规范链接
    site: 'https://example.com',
    
    // 基础路径，如果部署在子目录则需要设置
    base: '/',
    
    // 集成插件
    integrations: [
        mdx({
            // MDX 选项
            syntaxHighlight: 'shiki',
            shikiConfig: {
                theme: 'github-dark',
                wrap: true
            },
            remarkPlugins: [],
            rehypePlugins: [],
        }), 
        sitemap({
            // Sitemap 选项
            filter: (page) => !page.includes('/draft/'),
            changefreq: 'weekly',
            lastmod: new Date(),
        }), 
        vue(),
    ],
    
    // Vite 配置
    vite: {
        css: {
            transformer: "lightningcss",
        },
        // 优化本地开发
        optimizeDeps: {
            include: ['vue'],
        },
        // 防止一些预处理器警告
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        vue: ['vue']
                    }
                }
            }
        },
        // 环境变量前缀
        envPrefix: 'PUBLIC_'
    },
    
    // 开发工具栏配置
    devToolbar: {
        enabled: false,
    },
    
    // 开发服务器配置
    server: {
        host: 'localhost',
        port: 4321,
        // 在另一个标签页中打开
        open: true,
    },
    
    
    // 构建配置
    build: {
        // 构建格式：'directory' 或 'file'
        format: 'directory',
        // 资产文件名格式
        assets: 'assets',
        // 减小输出尺寸，适用于生产环境
        inlineStylesheets: 'auto',
    },
    
    // 国际化配置
    i18n: {
        defaultLocale: 'zh-cn',
        locales: ['zh-cn'],
        routing: {
            prefixDefaultLocale: false
        }
    },
    
    // 输出目录
    outDir: './dist',
    
    // 转换远程图像
    image: {
        domains: [],
        remotePatterns: [
            { protocol: "https" }
        ],
        // 处理远程图像时的服务
        service: { entrypoint: 'astro/assets/services/sharp' }
    },
    
});