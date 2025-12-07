/**
 * 简化的类型定义 - 只保留实际使用的配置
 */

/**
 * 站点配置类型定义 - 清理后只保留实际使用的配置
 */
export interface SiteConfig {
  // 核心基础信息
  title: string;
  description: string;
  short_description?: string;
  url: string;
  author?: string;
  siteName?: string;
  enableViewTransitions?: boolean;
  // SEO 基础配置
  titleDefault?: string;
  lang?: string;
  locale?: string;
  keywords?: string;
  canonical?: string;

  // 资源配置
  favicon?: string;
  avatarPath?: string;
  head?: string;

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

  // 页脚配置
  footer?: FooterConfig;
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
  style?: "plastic" | "flat" | "flat-square" | "for-the-badge" | "social";
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
