// 从 astro-seo 导入 TwitterCardType 类型用于类型定义
import type { TwitterCardType } from 'astro-seo';

/**
 * Open Graph 配置类型定义
 */
export interface OpenGraphConfig {
  basic: {
    title: string;
    type: string;
    image: string;
    url?: string;
  };
  optional?: {
    audio?: string;
    description?: string;
    determiner?: string;
    locale?: string;
    localeAlternate?: string[];
    siteName?: string;
    video?: string;
  };
  image?: {
    url?: string;
    secureUrl?: string;
    type?: string;
    width?: number;
    height?: number;
    alt?: string;
  };
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    expirationTime?: string;
    authors?: string[];
    section?: string;
    tags?: string[];
  };
}

/**
 * Twitter 卡片配置类型定义
 */
export interface TwitterConfig {
  card?: TwitterCardType;
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
}

/**
 * 扩展元标签配置
 */
export interface ExtendTagsConfig {
  meta?: Record<string, any>[];
  link?: Record<string, any>[];
}

/**
 * 站点配置类型定义
 */
export interface SiteConfig {
  // 基础信息
  head?: string;             // <head>元素硬嵌入
  title: string;
  description: string;
  url: string;
  keywords?: string;
  lang?: string;
  author?: string;
  locale?: string;
  siteName?: string;
  
  // 资源配置
  favicon?: string;
  avatarPath?: string; // 用户头像路径
  // SEO 高级配置
  titleTemplate?: string;    // 标题模板，如 "%s | 网站名称"
  titleDefault?: string;     // 默认标题
  canonical?: string;        // 规范链接
  noindex?: boolean;         // 控制页面是否被索引
  
  // 社交媒体配置
  ogImage?: string;
  openGraph?: OpenGraphConfig;
  twitterImage?: string;
  twitterCreator?: string;
  twitter?: TwitterConfig;
  
  // 扩展标签配置
  extend?: ExtendTagsConfig;
  
  // 结构化数据
  structuredData?: string | Record<string, any>;
  
  // 导航配置
  nav?: NavItem[];
  
  // 特效配置
  textyping?: string[];
  
  // 社交媒体链接
  medialinks?: MediaLink[];
  
  // 友情链接
  friendlinks_title?: string;
  friendlinks_description?: string;
  friendlinks?: FriendLink[];
  
  // 评论系统配置
  comment?: CommentConfig;
  
  // 页脚配置 - 整合了所有页脚相关设置
  footer?: FooterConfig;
  
  // 兼容旧版本的配置 (将在未来版本中移除)
  buildtime?: string | Date;       // 站点构建时间
  enableIcpBeian?: boolean;        // 是否启用ICP备案显示
  icpBeian?: string;
  enablePublicSecurityBeian?: boolean; // 是否启用公安备案显示
  publicSecurityBeian?: string;
  publicSecurityBeianNumber?: string;
  badges?: BadgeLink[];
  customBadges?: BadgeOptions[];
  copyright?: {
    enabled?: boolean;
    startYear?: number;
    customText?: string;
  };
  showPoweredBy?: boolean;
  showThemeInfo?: boolean;
}

/**
 * 页脚配置类型定义
 */
export interface FooterConfig {
  // 站点构建时间
  buildtime?: string | Date;
  
  // 版权信息
  copyright?: {
    enabled?: boolean;
    startYear?: number;
    customText?: string;
  };
  
  // 主题信息显示
  theme?: {
    showPoweredBy?: boolean;
    showThemeInfo?: boolean;
  };
  
  // 备案信息
  beian?: {
    // ICP备案
    icp?: {
      enabled?: boolean;
      number?: string;
    };
    // 公安备案
    security?: {
      enabled?: boolean;
      text?: string;
      number?: string;
    };
  };
  
  // 徽章
  badges?: BadgeOptions[];
}

/**
 * 导航项类型
 */
export interface NavItem {
  title: string;
  path: string;
  icon?: string;
}

/**
 * 社交媒体链接类型
 */
export interface MediaLink {
  title: string;
  url: string;
  icon?: string;
}

/**
 * 友情链接类型
 */
export interface FriendLink {
  title: string;
  url: string;
  avatar?: string;
  description?: string;
}

/**
 * 徽章链接类型
 */
export interface BadgeLink {
  src: string;
  alt: string;
  href?: string;
}

/**
 * 徽章选项类型
 */
export interface BadgeOptions {
  label: string;
  message: string;
  color?: string;
  style?: 'plastic' | 'flat' | 'flat-square' | 'for-the-badge' | 'social';
  labelColor?: string;
  logo?: string;
  logoWidth?: number;
  alt?: string;
  href?: string;
}

/**
 * 评论系统配置类型
 */
export interface CommentConfig {
  waline?: WalineConfig;
}

/**
 * Waline配置类型
 */
export interface WalineConfig {
  serverURL: string;
  path?: string;
  lang?: string;
  emoji?: string[];
  requiredFields?: string[];
  reaction?: boolean;
  meta?: string[];
  wordLimit?: number;
  pageSize?: number;
}