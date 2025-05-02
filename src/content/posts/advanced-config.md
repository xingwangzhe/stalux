---
title: "Stalux主题高级配置指南"
date: 2023-09-03
updated: 2023-09-20
description: "深入了解Stalux主题的高级配置选项，实现更强大的功能定制"
excerpt: "本文档详细介绍友情链接、徽章、备案信息等高级配置项，帮助你进一步定制博客"
tags: ["高级配置", "自定义", "功能扩展"]
categories: ["文档", "进阶教程"]
---


# Stalux主题高级配置指南

本文档介绍Stalux主题的高级配置选项，帮助你进一步定制你的博客。

## 友情链接配置

友情链接页面可以通过以下配置进行自定义：

```typescript
export const config_site: Partial<SiteConfig> = {
  // 友链页面标题
  friendlinks_title: '友情链接',
  
  // 友链页面描述
  friendlinks_description: '这里是我收集的一些优质博客和网站，欢迎访问。',
  
  // 友链列表
  friendlinks: [
    { 
      title: '网站名称',
      url: 'https://example.com',
      avatar: 'https://example.com/favicon.png',
      description: '网站简短描述'
    },
    // 更多友链...
  ],
}
```

每个友链项支持以下属性：
- `title`: 友链网站名称
- `url`: 友链网站地址
- `avatar`: 友链网站头像/图标
- `description`: 友链网站简介

## 徽章配置

Stalux支持在页脚通过badge-maker库本地生成徽章，不依赖外部服务：

```typescript
import type { BadgeOptions } from './types';

export const config_site: Partial<SiteConfig> = {
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
      href: 'https://github.com/yourusername'
    },
    // 更多徽章...
  ] as BadgeOptions[],
}
```

每个徽章支持以下选项：
- `label`: 徽章左侧标签文本
- `message`: 徽章右侧内容文本
- `color`: 徽章颜色（支持颜色名称或十六进制色值）
- `alt`: 徽章alt文本（对SEO和可访问性有帮助）
- `href`: 点击徽章跳转的链接
- `style`: 徽章样式，可选值有`'flat'`（默认）、`'flat-square'`、`'for-the-badge'`、`'plastic'`、`'social'`

## 备案信息配置

如果你的网站需要显示中国大陆的ICP备案信息或公安备案信息，可以通过以下配置：

```typescript
export const config_site: Partial<SiteConfig> = {
  // ICP备案配置
  enableIcpBeian: true,                     // 是否启用ICP备案显示
  icpBeian: '京ICP备XXXXXXXX号',            // ICP备案号
  
  // 公安备案配置
  enablePublicSecurityBeian: true,          // 是否启用公安备案显示
  publicSecurityBeian: '京公网安备 XXXXXXXXXXXX号',  // 公安备案号文字
  publicSecurityBeianNumber: 'XXXXXXXXXXXX',  // 公安备案号数字部分(用于链接)
}
```

## 自定义head插入

你可以在`<head>`元素中插入任何HTML代码，例如添加自定义CSS、字体、分析脚本等：

```typescript
export const config_site: Partial<SiteConfig> = {
  head: `
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
    
    <!-- 自定义CSS -->
    <style>
      :root {
        --font-family-base: 'Noto Sans SC', sans-serif;
        --primary-color: #3498db;
      }
    </style>
    
    <!-- Umami Analytics -->
    <script async defer src="https://analytics.example.com/script.js" data-website-id="your-website-id"></script>
  `,
}
```

## 结构化数据配置

Stalux支持添加结构化数据（JSON-LD）以增强SEO：

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
      "url": "https://yourdomain.com/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "你的组织名称",
      "logo": {
        "@type": "ImageObject",
        "url": "https://yourdomain.com/logo.png"
      }
    }
  }),
}
```

## 内容集合配置

Stalux使用Astro的Content Collections功能管理内容。主题已经预配置了`posts`和`about`集合，你可以在`src/content.config.ts`中查看或扩展这些集合的定义。

### Posts集合（文章集合）

文章前置元数据支持以下字段：

```markdown
---
title: 文章标题
date: 2023-01-01
updated: 2023-01-15
description: 文章描述，用于SEO
excerpt: 文章摘要，显示在文章列表
cover: /path/to/cover-image.jpg
author: 作者名称
tags: [标签1, 标签2]
categories: [分类1, 分类2]
abbrlink: custom-slug  # 自定义URL slug
noindex: false  # 是否不被搜索引擎索引
---
```

### About集合（关于页面集合）

关于页面前置元数据支持以下字段：

```markdown
---
title: 关于页面标题
priority: 10  # 优先级，数字越大优先级越高
---
```

## 高级定制

如果需要进一步定制主题，可以通过修改源代码或创建组件覆盖实现。Stalux主题的主要组件位于`src/components`目录下，布局位于`src/layouts`目录下。
