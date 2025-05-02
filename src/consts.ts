import type { SiteConfig, BadgeOptions } from './types'; // Import BadgeOptions

export const site: SiteConfig = { 
  /**
   * <head>元素硬嵌入
   * 可以在此处添加自定义的meta标签、脚本、样式等
   */
  head: `<meta name="nishia" content="nihaiso">
        <script>console.log("欢迎使用Stalux主题")</script>`,
  
  /**
   * SEO 核心配置
   * 这些配置对搜索引擎优化至关重要
   */
  title: 'Stalux',                        // 网站标题，SEO最重要的因素之一
  description: '博客主题Stalux',          // 网站描述，建议150-160字符以获得最佳SEO效果
  url: 'https://stalux.needhelp.icu',     // 完整网站URL(包含https协议)
  
  /**
   * 重要SEO辅助配置
   */
  keywords: '关键词',                     // 网站关键词，虽然权重下降但仍有参考价值
  lang: 'zh-CN',                          // 语言设置，有助于地区搜索引擎理解内容
  
  /**
   * 基础站点信息
   */
  author: 'xingwangzhe',                  // 内容创作者信息
  locale: 'zh_CN',                        // 内容的区域设置
  siteName: 'Stalux',                     // 站点名称，用于品牌构建
  
  /**
   * 站点资源配置
   * 用户体验相关，间接提升SEO价值
   */
  favicon: '/stalux.ico',                // 网站图标和iOS设备添加到主屏的图标
  // avatarPath: 'src/images/avatar.webp', // 用户头像路径
  
  /**
   * 社交媒体优化配置
   * 主要针对社交平台分享显示
   */
  ogImage: 'https://www.baidu.com/og-image.jpg',        // Open Graph 分享图片
  twitterImage: 'https://www.baidu.com/twitter-image.jpg', // Twitter分享图片
  twitterCreator: '@yourTwitterHandle',                  // Twitter账号
  
  /**
   * 高级SEO配置
   * 结构化数据有助于搜索引擎展示富结果
   */
  structuredData: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "sitename",
    "url": "https://stalux.needhelp.icu",
    "description": "描述啊",
    "author": {
      "@type": "Person",
      "name": "xingwangzhe",
    }
  }),

  /**
   * 站点导航配置
   */
  nav: [
    { title: '首页', path: '/', icon: 'home' },
    { title: '归档', path: '/archives', icon: 'archive' },
    { title: '分类', path: '/categories', icon: 'folder' },
    { title: '标签', path: '/tags', icon: 'tag' },
    { title: '友链', path: '/links', icon: 'link' },
    { title: '关于', path: '/about', icon: 'user' },
  ],

  /**
   * 站点特效配置
   */
  textyping: [  // 打字机效果文字
    'Free for free, not free for charge!', 
    '因为我姓王,所以姓王者',
    '任意键在哪?',
    'F12看看?',
    'Hello World!',
  ],
  
  /**
   * 社交媒体链接配置
   */
  medialinks: [
    { title: 'Github', url: 'https://github.com/', icon: 'github' },
    { title: 'Bilibili', url: 'https://space.bilibili.com/', icon: 'bilibili' },
    { title: 'Twitter', url: 'https://x.com/', icon: 'x-twitter' },
    { title: 'Weibo', url: 'https://weibo.com/', icon: 'sinaweibo' },
    { title: 'QQ', url: 'https://qm.qq.com/', icon: 'qq' },
    { title: 'Telegram', url: 'https://t.me/', icon: 'telegram' },
    { title: 'Discord', url: 'https://discord.gg/', icon: 'discord' },
  ],
  
  /**
   * 友情链接配置
   */
  friendlinks_title: '友情链接', 
  friendlinks_description: '优质技术博客交换友情链接，互惠共赢提升网站流量和用户体验。期待与同领域高质量内容创作者建立长期合作关系。',
  friendlinks: [
    { 
      title: 'Astro', 
      url: 'https://astro.build/',
      avatar: 'https://astro.build/favicon.svg', 
      description: 'The web framework for content-driven websites' 
    },
    { 
      title: 'Vue', 
      url: 'https://cn.vuejs.org/',
      avatar: 'https://cn.vuejs.org/logo.svg', 
      description: '易学易用，性能出色，适用场景丰富的 Web 前端框架。' 
    },
    { 
      title: 'MDN Web Docs', 
      url: 'https://developer.mozilla.org/',
      avatar: 'https://developer.mozilla.org/favicon.ico', 
      description: 'Documenting web technologies, including CSS, HTML, and JavaScript, since 2005.' 
    },
    {
      title: 'Simple Icons',
      url: 'https://simpleicons.org/',
      avatar: 'https://simpleicons.org/favicon.ico',
      description: '流行品牌的 3282 SVG 图标'
    },
    {
      title: 'Feather',
      url: 'https://feathericons.com/',
      avatar: 'https://feathericons.com/favicon.ico',
      description: 'Beautifully simple open-source icons'
    }
  ],

  /**
   * 页脚配置 - 备案信息
   * 如果不需要可以留空或删除
   */
  enableIcpBeian: true,                     // 是否启用ICP备案显示
  icpBeian: '辽ICP备XXXXXXXX号',             // ICP备案号，如不需要可留空

  // 公安备案信息配置
  enablePublicSecurityBeian: true,          // 是否启用公安备案显示
  publicSecurityBeian: '辽公网安备 XXXXXXXXXXXX号',  // 公安备案号文字
  publicSecurityBeianNumber: 'XXXXXXXXXXXX',  // 公安备案号数字部分(用于链接跳转)

  /**
   * 页脚配置 - 本地生成徽章
   * 完全通过badge-maker本地生成，不依赖远程服务
   * 参考：https://www.npmjs.com/package/badge-maker
   */
  customBadges: [
    {
      label: 'license',
      message: 'MIT',
      color: 'blue',
      alt: 'License: MIT',
      href: 'https://opensource.org/licenses/MIT'
    },
    {
      label: 'Built with',
      message: '❤',
      color: 'pink',
      style: 'for-the-badge',
      alt: 'Built with Love',
      href: 'https://github.com/xingwangzhe'
    },
    {
      label: 'Powered by',
      message: 'Astro',
      color: 'orange',
      style: 'flat-square',
      alt: 'Powered by Astro',
      href: 'https://astro.build/'
    },
    {
      label: 'Theme',
      message: 'Stalux',
      color: 'blueviolet',
      alt: 'Theme: Stalux',
      href: 'https://stalux.needhelp.icu/'
    }
  ] as BadgeOptions[],
  /**
   * 页脚配置 - 版权和主题信息
   */
  copyright: {
    enabled: true,           // 是否启用版权信息
    startYear: 2023,         // 可选：起始年份，如设置为2023，则显示2023-2025
    customText: ''           // 可选：自定义版权文本，如为空则使用默认格式
  },
  
  showPoweredBy: true,       // 是否显示"Powered by Astro"
  showThemeInfo: true        // 是否显示"Theme is Stalux"
}
