//默认配置
export const site = {
    // 核心SEO必要配置 - 这些配置对SEO有最直接影响
    title: 'sitename',                                  // 必要: 网站标题，SEO最关键因素
    description: '描述啊',                              // 必要: 网站描述，影响搜索摘要和点击率
    url: 'https://nihao.needhelp.com',                  // 必要: 完整URL，包含https
    
    // 重要但可选的配置 - 提供明显SEO价值
    keywords: '关键词',                                 // 重要: 虽然权重降低，但仍有参考价值
    lang: 'zh-CN',                                      // 重要: 有助于地区性搜索引擎优化
    
    // 次要SEO配置 - 有特定场景的SEO价值
    author: '作者名称',                                 // 可选: 对某些垂直领域有辅助价值
    locale: 'zh_CN',                                    // 可选: 用于国际化站点的语言区域标识
    siteName: '站点名称',                               // 可选: 有助于品牌构建
    
    // 资源文件 - 主要用于用户体验，间接SEO价值
    favicon: '',                            // 可选: 浏览器标签页图标
    appleTouchIcon: '',            // 可选: iOS设备主屏图标
    
    // 社交分享优化 - 对社交媒体流量有价值，但非核心SEO
    ogImage: '', // 可选: 社交平台分享图片
    twitterImage: '', // 可选: 若Twitter不是目标平台可省略
    twitterCreator: '',               // 可选: 国内站点可忽略此配置
    
    // 高级SEO技术 - 增强搜索结果展示，但复杂度较高
    structuredData: JSON.stringify({                    // 可选: 结构化数据，提升特殊搜索结果展示

    }),
    nav: [
        { title: 'home', path: '/' },
        { title: 'about', path: '/about'},
    ], 

    textyping:['这是我的世界', '默认打字效果'], // 打字机效果文字
}
