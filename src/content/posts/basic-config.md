---
title: "Stalux主题基础配置指南"
date: 2023-09-01
updated: 2023-09-10
description: "快速上手Stalux主题的基础配置选项，打造个性化博客"
excerpt: "本文档介绍Stalux主题的基础配置方法，包括网站信息、导航菜单、打字机效果等常用设置"
tags: ["基础配置", "入门", "快速开始"]
categories: ["文档", "入门教程"]
---

# Stalux主题基础配置指南

Stalux主题提供了丰富的配置选项，本文档将介绍如何配置基础功能。

## 配置方法

Stalux主题使用TypeScript进行配置。你需要在项目根目录创建一个`src/_config.ts`文件来覆盖默认配置。

基本结构如下：

```typescript
// src/_config.ts
import type { SiteConfig } from './types';

// 导出你的配置
export const config_site: Partial<SiteConfig> = {
  // 在这里添加你的配置项
  title: '我的博客',
  description: '这是我的个人博客',
  // 其他配置...
};
```

## 基础配置项

### 网站信息

```typescript
export const config_site: Partial<SiteConfig> = {
  // 网站标题
  title: '我的博客',
  
  // 网站描述
  description: '这是我的个人博客网站，分享技术和生活',
  
  // 站点完整URL
  url: 'https://yourdomain.com',
  
  // 网站作者
  author: 'Your Name',
  
  // 网站语言
  lang: 'zh-CN',
  
  // 区域设置
  locale: 'zh_CN',
  
  // 站点名称(可与标题不同)
  siteName: 'My Awesome Blog',
  
  // 网站关键词
  keywords: 'blog,tech,programming',
}
```

### 导航菜单

导航菜单定义了网站的主要链接结构：

```typescript
export const config_site: Partial<SiteConfig> = {
  nav: [
    { title: '首页', path: '/', icon: 'home' },
    { title: '归档', path: '/archives', icon: 'archive' },
    { title: '分类', path: '/categories', icon: 'folder' },
    { title: '标签', path: '/tags', icon: 'tag' },
    { title: '友链', path: '/links', icon: 'link' },
    { title: '关于', path: '/about', icon: 'user' },
    // 你可以添加自定义链接
    { title: '项目', path: '/projects', icon: 'code' },
  ],
}
```

每个导航项支持以下属性：
- `title`: 显示的标题文本
- `path`: 链接路径
- `icon`: 图标名称（基于Feather图标集）

### 打字机效果

网站首页的打字机效果可以通过以下配置：

```typescript
export const config_site: Partial<SiteConfig> = {
  textyping: [
    '这是第一行打字机文本',
    '这是第二行打字机文本',
    'Hello World!',
    '欢迎来到我的博客',
  ],
}
```

### 社交媒体链接

配置页脚的社交媒体链接：

```typescript
export const config_site: Partial<SiteConfig> = {
  medialinks: [
    { title: 'Github', url: 'https://github.com/yourusername', icon: 'github' },
    { title: 'Bilibili', url: 'https://space.bilibili.com/yourid', icon: 'bilibili' },
    { title: 'Twitter', url: 'https://twitter.com/yourusername', icon: 'x-twitter' },
    // 更多社交媒体链接...
  ],
}
```

每个社交链接支持：
- `title`: 显示的标题（鼠标悬停时）
- `url`: 链接地址
- `icon`: 图标名称（支持Simple Icons和Feather图标）

## 自定义head内容

如果需要添加自定义meta标签、脚本或样式，可以使用head配置：

```typescript
export const config_site: Partial<SiteConfig> = {
  head: `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    </script>
  `,
}
```

## 页脚版权信息

配置页脚的版权信息：

```typescript
export const config_site: Partial<SiteConfig> = {
  copyright: {
    enabled: true,           // 是否启用版权信息
    startYear: 2023,         // 起始年份，将显示为 2023-当前年份
    customText: '版权所有 © My Blog'  // 自定义版权文本（可选）
  },
  
  // 是否显示"Powered by Astro"
  showPoweredBy: true,
  
  // 是否显示"Theme is Stalux"
  showThemeInfo: true
}
```

## 网站图标

配置网站图标：

```typescript
export const config_site: Partial<SiteConfig> = {
  favicon: '/custom-favicon.ico',  // 相对于public目录
}
```
