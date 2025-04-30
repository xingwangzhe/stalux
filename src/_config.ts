export const config_site = {
    // 核心SEO必要配置
    title: '姓王者的博客',                                  // 必要: 页面标题，SEO最重要因素
    description: '描述啊',                              // 必要: 网站描述，影响搜索结果展示和CTR
    url: 'https://www.baidu.com',                       // 必要: 网站URL，需完整包含https
    
    // 重要但非必须的配置
    keywords: '关键词',                                 // 重要: 关键词，虽然权重下降但仍有参考价值
    lang: 'zh-CN',                                      // 重要: 有助于地区搜索引擎理解内容
    
    // 可选配置 - 有一定SEO价值但非必需
    author: '姓王者',                                 // 可选: 内容创作者信息
    locale: 'zh_CN',                                    // 可选: 内容的区域设置
    siteName: '站点名称',                               // 可选: 站点名称，用于品牌构建
    
    // 资源文件配置 - 用户体验相关，间接SEO价值
    favicon: '/favicon.ico',                            // 可选: 网站图标
    appleTouchIcon: '/apple-touch-icon.png',            // 可选: iOS设备添加到主屏的图标
    avatarPath: 'avatar.webp',                          // 可选: 自定义头像路径，不提供则使用默认头像
    
    // 社交媒体优化配置 - 主要针对社交分享，非核心SEO
    ogImage: 'https://www.baidu.com/og-image.jpg',      // 可选: 社交媒体分享图片
    twitterImage: 'https://www.baidu.com/twitter-image.jpg', // 可选: Twitter分享图片
    twitterCreator: '@yourTwitterHandle',               // 可选: Twitter账号，仅Twitter流量有价值时需要
    
    // 高级SEO配置 - 有助于富结果展示，但实现复杂
    structuredData: JSON.stringify({                    // 可选: 结构化数据，可提升特殊搜索结果展示
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "sitename",
        "url": "https://www.baidu.com",
        "description": "描述啊",
        "author": {
            "@type": "Person",
            "name": "作者名称"
        }
    }),
    // 站点导航配置
    nav: [
        { title: 'home', path: '/' },
        { title: 'about', path: '/about'},
    ],

    textyping: // 打字机效果文字
    [
        'Free for free, not free for charge!', 
        '因为我姓王,所以姓王者',
        '任意键在哪?',
        'F12看看?',
        'Hello World!',
        
    ],
    // 社媒链接
    medialinks: [
        { title: 'Github', url: 'https://github.com/', icon: 'github'},
        { title: 'Bilibili', url: 'https://space.bilibili.com/', icon: 'bilibili'},
        { title: 'Twitter', url: 'https://x.com/', icon: 'x-twitter'},
        { title: 'Weibo', url: 'https://weibo.com/', icon: 'weibo'},
        { title: 'QQ', url: 'https://qm.qq.com/', icon: 'qq'},
        { title: 'Telegram', url: 'https://t.me/', icon: 'telegram'},
        { title: 'Discord', url: 'https://discord.gg/', icon: 'discord'},
    ]
}