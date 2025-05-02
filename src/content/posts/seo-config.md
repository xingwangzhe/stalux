---
title: "Stalux主题SEO优化配置指南"
date: 2023-09-05
updated: 2023-09-25
description: "全面掌握Stalux主题的SEO优化配置，提升网站在搜索引擎中的可见度"
excerpt: "本文档详细介绍如何配置站点元数据、结构化数据、图像优化等SEO功能，帮助你的内容在搜索引擎中获得更好的排名"
tags: ["SEO", "搜索引擎优化", "网站营销", "元数据"]
categories: ["文档", "优化指南"]
---

# Stalux主题SEO优化配置指南

搜索引擎优化(SEO)对于提高网站在搜索引擎中的可见性至关重要。Stalux主题内置了丰富的SEO优化功能，本文档将指导你如何配置这些功能。

## 基础SEO配置

在`src/_config.ts`文件中，可以配置以下基础SEO选项：

```typescript
export const config_site: Partial<SiteConfig> = {
  // 网站标题 - SEO最重要的因素之一
  title: 'Stalux博客',
  
  // 网站描述 - 建议控制在150-160字符以内
  description: '这是一个使用Stalux主题的Astro博客，专注于分享前端开发、Web技术和个人随笔。',
  
  // 网站URL - 必须包含完整协议(https://)
  url: 'https://yourdomain.com',
  
  // 网站关键词 - 虽然现代搜索引擎对此权重降低，但仍有参考价值
  keywords: '博客,前端开发,Web技术,JavaScript,TypeScript,Astro',
  
  // 语言设置 - 有助于搜索引擎理解内容语言
  lang: 'zh-CN',
  
  // 内容区域设置
  locale: 'zh_CN',
}
```

## 社交媒体优化

针对社交媒体分享的优化配置：

```typescript
export const config_site: Partial<SiteConfig> = {
  // Open Graph 图片 - 用于Facebook、微信等平台分享时显示
  ogImage: 'https://yourdomain.com/og-image.jpg',
  
  // Twitter卡片图片
  twitterImage: 'https://yourdomain.com/twitter-image.jpg',
  
  // Twitter作者账号
  twitterCreator: '@yourTwitterHandle',
  
  // 网站图标 - 显示在浏览器标签和收藏夹中
  favicon: '/favicon.ico',
}
```

## 结构化数据

结构化数据有助于搜索引擎展示富结果，Stalux支持自定义JSON-LD结构化数据：

```typescript
export const config_site: Partial<SiteConfig> = {
  structuredData: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "你的网站名称",
    "url": "https://yourdomain.com",
    "description": "网站描述",
    "author": {
      "@type": "Person",
      "name": "你的名字",
      "url": "https://yourdomain.com/about",
      "image": "https://yourdomain.com/author.jpg"
    },
    "publisher": {
      "@type": "Organization",
      "name": "你的组织名称",
      "logo": {
        "@type": "ImageObject",
        "url": "https://yourdomain.com/logo.png",
        "width": "600",
        "height": "60"
      }
    }
  }),
}
```

## 文章SEO优化

在每篇文章的前置元数据中，你可以设置以下SEO相关字段：

```markdown
---
title: 文章标题 - 关键词1 | 关键词2  # 尽量包含关键词
description: 详细描述这篇文章的内容，控制在150-160字符，包含主要关键词。
date: 2023-01-01  # 发布日期
updated: 2023-01-15  # 更新日期(有利于搜索引擎了解内容鲜度)
cover: /images/article-cover.jpg  # 文章封面图(也用于社交分享)
tags: [JavaScript, 前端优化, Web性能]  # 标签有助于内容分类
categories: [前端开发, 性能优化]  # 分类便于内容组织
noindex: false  # 设置为true可阻止搜索引擎索引此页面
---
```

## 站点地图与RSS

Stalux主题自动生成站点地图(`sitemap.xml`)和RSS订阅源(`rss.xml`)，有助于搜索引擎发现和索引你的内容。确保在配置中提供正确的网站URL：

```typescript
export const config_site: Partial<SiteConfig> = {
  url: 'https://yourdomain.com',  // 必须是完整URL，包含https://
}
```

## robots.txt配置

Stalux会自动生成基本的`robots.txt`文件。如需自定义，可以在`public`目录中创建自己的`robots.txt`文件：

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: https://yourdomain.com/sitemap.xml
```

## 禁止索引特定页面

如果你不希望某些页面被搜索引擎索引，有两种方法：

1. **在文章前置元数据中设置**：
   ```markdown
   ---
   title: 私密文章
   noindex: true
   ---
   ```

2. **在配置文件中全局设置特定页面**：
   ```typescript
   export const config_site: Partial<SiteConfig> = {
     noindexPaths: [
       '/private/',
       '/draft-posts/',
       '/secret-page/'
     ]
   }
   ```

## 自定义meta标签

通过head配置添加自定义meta标签：

```typescript
export const config_site: Partial<SiteConfig> = {
  head: `
    <!-- 自定义元标签 -->
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">
    <meta name="author" content="你的名字">
    <meta name="copyright" content="© 2023 你的网站名称">
    
    <!-- 百度站长验证 -->
    <meta name="baidu-site-verification" content="code-xxxxxxxxxx">
    
    <!-- Google站长验证 -->
    <meta name="google-site-verification" content="xxxxxxxxxxx">
  `,
}
```

## 页面性能优化

页面性能是SEO的重要因素。Stalux主题内置了以下性能优化：

1. **图片优化**：使用Astro内置的图片优化
2. **代码分割**：只加载必要的JavaScript
3. **CSS优化**：关键CSS内联，非关键CSS延迟加载
4. **字体优化**：使用`font-display: swap`提高文本可见性

## 国内SEO特殊配置

针对中国搜索引擎(如百度)的特殊配置：

```typescript
export const config_site: Partial<SiteConfig> = {
  // ICP备案信息 - 有助于提升百度搜索信任度
  enableIcpBeian: true,
  icpBeian: '京ICP备xxxxxxxx号',
  
  // 公安备案信息
  enablePublicSecurityBeian: true,
  publicSecurityBeian: '京公网安备 xxxxxxxxxxxxxx号',
  publicSecurityBeianNumber: 'xxxxxxxxxxxxxx',
  
  // 百度自动推送
  head: `
    <script>
    (function(){
      var bp = document.createElement('script');
      var curProtocol = window.location.protocol.split(':')[0];
      if (curProtocol === 'https') {
          bp.src = 'https://zz.bdstatic.com/linksubmit/push.js';
      }
      else {
          bp.src = 'http://push.zhanzhang.baidu.com/push.js';
      }
      var s = document.getElementsByTagName("script")[0];
      s.parentNode.insertBefore(bp, s);
    })();
    </script>
  `,
}
```

## SEO最佳实践

1. **定期发布高质量内容**：搜索引擎青睐定期更新的高质量内容
2. **内部链接优化**：通过相关文章推荐等方式增加内部链接
3. **URL优化**：使用简洁、包含关键词的URL
4. **图片优化**：为所有图片添加alt属性
5. **移动设备兼容性**：确保网站在移动设备上表现良好
6. **页面加载速度**：优化页面加载速度，提升用户体验
7. **外部链接建设**：获取高质量网站的反向链接
8. **监控分析**：定期检查SEO表现并据此调整策略
