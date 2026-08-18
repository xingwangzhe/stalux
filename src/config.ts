/**
 * Stalux 集成配置选项
 *
 * 用户在 astro.config.mjs 中传入这些选项来自定义主题行为。
 */

import type { SitemapOptions } from "@astrojs/sitemap";

import type { ExpressiveCodeOptions } from "./expressive-code";
import type { StaluxComponentKey } from "./internal/override";

/** 用户可覆盖的组件映射 */
export type ComponentOverrideMap = Partial<Record<StaluxComponentKey, string>>;

/** 内容集合路径配置 */
export interface ContentPaths {
    /** 内容根目录，默认为 "stalux" */
    root?: string;
    /** 文章目录，相对于 root */
    posts?: string;
    /** 配置目录，相对于 root */
    config?: string;
    /** 关于页面目录，相对于 root */
    about?: string;
    /** 随想目录，相对于 root */
    words?: string;
}

/** Analytics 配置 */
export interface AnalyticsConfig {
    googleAnalyticsId?: string;
    bingClarityId?: string;
    umami?: {
        id: string;
        url: string;
    };
}

/** Stalux 集成选项 */
export interface StaluxOptions {
    /** 内容目录路径（默认 "stalux"） */
    contentDir?: string;

    /** 内容子目录路径覆盖 */
    contentPaths?: ContentPaths;

    /** 组件覆盖映射 */
    components?: ComponentOverrideMap;

    /** Analytics 配置 */
    analytics?: AnalyticsConfig;

    /** 构建后是否自动运行 Pagefind 索引（默认 true） */
    pagefind?: boolean;

    /** 开发工具栏应用（默认 true） */
    devToolbar?: boolean;

    /** 站点 URL（默认从 astro.config 读取） */
    site?: string;

    /**
     * 是否自动打包 @astrojs/sitemap（默认 true）。
     * 传 false 关闭；传对象自定义选项（filter 会与默认的 .md 源码端点过滤叠加）。
     */
    sitemap?: boolean | SitemapOptions;

    /**
     * 是否自动打包 Expressive Code（默认 true，带代码块行号插件）。
     * 传 false 关闭；传对象自定义主题/样式等选项。
     */
    expressiveCode?: boolean | ExpressiveCodeOptions;
}
