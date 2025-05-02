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
  
  // 社交媒体配置
  ogImage?: string;
  twitterImage?: string;
  twitterCreator?: string;
  
  // 结构化数据
  structuredData?: string;
  
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
  
  // 页脚配置 - 备案信息
  enableIcpBeian?: boolean;         // 是否启用ICP备案显示
  icpBeian?: string;
  enablePublicSecurityBeian?: boolean; // 是否启用公安备案显示
  publicSecurityBeian?: string;
  publicSecurityBeianNumber?: string;
  
  // 页脚配置 - 徽章
  badges?: BadgeLink[];
  customBadges?: BadgeOptions[];

  // 页脚配置 - 版权和主题信息
  copyright?: {
    enabled?: boolean;
    startYear?: number;
    customText?: string;
  };
  showPoweredBy?: boolean;
  showThemeInfo?: boolean;
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