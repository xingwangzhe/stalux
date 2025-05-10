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
   * SEO 高级配置
   */           
  titleDefault: 'Stalux博客',             // 默认标题，当没有指定标题时使用
  canonical: 'https://stalux.needhelp.icu', // 规范链接，防止重复内容
  
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
  ogImage: 'https://www.baidu.com/og-image.jpg',        // Open Graph 分享图片 (简单配置)
  openGraph: {                                          // Open Graph 完整配置
    basic: {
      title: 'Stalux - 专业博客主题',
      type: 'website',
      image: 'https://www.baidu.com/og-image.jpg',
      url: 'https://stalux.needhelp.icu',
    },
    optional: {
      description: '博客主题Stalux - 为内容创作者提供专业的展示平台',
      locale: 'zh_CN',
      siteName: 'Stalux'
    },
    image: {
      alt: 'Stalux主题预览图'
    }
  },
  twitterImage: 'https://www.baidu.com/twitter-image.jpg', // Twitter分享图片 (简单配置)
  twitterCreator: '@yourTwitterHandle',                  // Twitter账号
  twitter: {                                            // Twitter 完整配置
    card: 'summary_large_image',
    site: 'Stalux',
    creator: '@yourTwitterHandle',
    title: 'Stalux - 专业博客主题',
    description: '博客主题Stalux - 为内容创作者提供专业的展示平台',
    image: 'https://www.baidu.com/twitter-image.jpg',
    imageAlt: 'Stalux主题预览图'
  },
  
  /**
   * 额外HTML标签扩展
   * 用于添加自定义meta和link标签
   */
  extend: {
    meta: [
      { name: 'application-name', content: 'Stalux' },
      { name: 'apple-mobile-web-app-title', content: 'Stalux' },
      { name: 'theme-color', content: '#3367D6' }
    ],
    link: [
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#5bbad5' }
    ]
  },
  
  /**
   * 高级SEO配置
   * 结构化数据有助于搜索引擎展示富结果
   */
  structuredData: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Stalux",
    "url": "https://stalux.needhelp.icu",
    "description": "博客主题Stalux - 为内容创作者提供专业的展示平台",
    "author": {
      "@type": "Person",
      "name": "xingwangzhe",
    }
  },

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
    '任意键在哪?',
    'F12看看?',
    'Hello World!',
  ],
  
  /**
   * 评论系统配置
   */
  comment: {
    waline: {
      serverURL: 'https://waline.xingwangzhe.fun', // 你的Waline服务器地址 //我加白名单了,别让我在日志里逮到你用(╯▔皿▔)╯
      lang: 'zh-CN',                               // 语言设置
      emoji: ['https://unpkg.com/@waline/emojis@1.1.0/weibo'],  // 表情包设置
      requiredFields: [],                          // 必填项
      reaction: true,                              // 文章反应
      meta: ['nick', 'mail', 'link'],             // 评论者的元数据
      wordLimit: 200,                              // 字数限制
      pageSize: 10                                 // 评论分页大小
    }
  },
  
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
   * 页脚配置
   * 整合所有页脚相关设置，便于管理
   */  
  footer: {
    // 站点构建时间，用于计算运行时长
    buildtime: '2024-06-20T10:00:00',  // 站点构建时间，推荐使用ISO 8601标准格式(YYYY-MM-DDTHH:MM:SS)
    // 支持的buildtime格式:
    // 1. ISO 8601标准格式 (推荐): '2023-06-20T10:00:00'
    // 2. 常用中文格式: '2023-06-20 10:00:00' 或 '2023-6-20 10:00:00'
    // 3. 简化格式: '2023-06-20' (时间默认为 00:00:00)
    // 4. 时间戳: 1687230000000 (毫秒)
    // 注意: 日期必须是过去的时间，未来时间将被自动调整为当前时间
    
    // 版权信息
    copyright: {
      enabled: true,           // 是否启用版权信息
      startYear: 2024,         // 可选：起始年份，如设置为2024，则显示2024-2025
      customText: ''           // 可选：自定义版权文本，如为空则使用默认格式
    },
    
    // 主题信息
    theme: {
      showPoweredBy: true,     // 是否显示"Powered by Astro"
      showThemeInfo: true      // 是否显示"Theme is Stalux"
    },
    
    // 备案信息
    beian: {
      // ICP备案
      icp: {
        enabled: true,                    // 是否启用ICP备案显示
        number: '辽ICP备XXXXXXXX号'        // ICP备案号，如不需要可留空
      },
      // 公安备案
      security: {
        enabled: true,                           // 是否启用公安备案显示
        text: '辽公网安备 XXXXXXXXXXXX号',        // 公安备案号文字
        number: 'XXXXXXXXXXXX'                   // 公安备案号数字部分(用于链接跳转)
      }
    },
    
    // 徽章配置
    badges: [
      {
        label: 'Built with',
        message: '❤',
        color: 'red',
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
      },
      {
        label: 'license',
        message: 'MIT',
        color: 'blue',
        alt: 'License: MIT',
        href: 'https://github.com/xingwangzhe/stalux'
      },
    ] as BadgeOptions[]
  }
}
