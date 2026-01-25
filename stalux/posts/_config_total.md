---
title: Stalux 主题配置总览
tags:
    - 配置
    - 入门
categories:
    - 主题配置
date: 2025-5-10T10:00:00+08:00
updated: 2025-5-10T16:00:00+08:00
abbrlink: 0b563d42
---

欢迎使用 Stalux 主题！本文将为您介绍 Stalux 主题的配置系统和基本使用方法。

## 什么是 Stalux

Stalux 是一个基于 Astro 5 构建的现代化博客主题，专为内容创作者设计。它提供了简洁优雅的暗色界面、强大的自定义功能和优异的性能表现。

## 核心特性

- 🚀 **极速性能**: 基于 Astro 5 静态生成，加载速度极快
- 🎨 **暗色主题**: 优雅的暗色设计，提供舒适的阅读体验
- 📝 **Markdown 支持**: 支持 Markdown 和 MDX，支持代码高亮和数学公式
- 💬 **评论系统**: 集成 Waline 评论系统
- 🔍 **全文搜索**: 内置 Pagefind 搜索功能
- 📱 **响应式设计**: 完美适配移动端和桌面端
- 🎯 **SEO 优化**: 自动生成 sitemap、RSS 和 Atom feed

## 配置文件说明

Stalux 主题使用 `config.yml` 文件进行配置，该文件位于项目根目录。

### 配置文件位置

```
你的项目/
├── config.yml          # 主配置文件（你需要编辑这个文件）
├── src/
│   └── content.config.ts  # 配置结构定义（定义了所有可用的配置项）
└── stalux/
    ├── posts/          # 存放文章
    └── about/          # 存放关于页面
```

### 配置结构概览

`config.yml` 文件包含以下主要部分：

```yaml
stalux:
  # 1. 基本信息
  title: 网站标题
  url: 网站地址
  description: 网站描述
  
  # 2. 作者信息
  author:
    name: 作者名称
    avatar: 头像路径
    bio: 个人简介
  
  # 3. 导航菜单
  navs:
    - 导航项列表
  
  # 4. 打字动效文字
  typetexts:
    - 随机显示的文字
  
  # 5. 社交媒体链接
  mediaLinks:
    - 社交媒体图标和链接
  
  # 6. 友情链接
  links:
    title: 友链标题
    sites: 友链列表
  
  # 7. 页脚配置
  footer:
    版权、备案、徽章等
  
  # 8. 评论系统
  comment:
    waline: Waline 配置
```

## 快速开始

### 第一步：基本信息配置

首先配置网站的基本信息：

```yaml
stalux:
  title: 我的博客
  url: https://yourdomain.com
  description: 这是我的个人博客，分享技术和生活
  favicon: /favicon.svg
  
  author:
    name: 你的名字
    avatar: /avatar.png
    bio: 一句话介绍自己
```

这些是**必填项**，决定了网站的基础信息和 SEO。

### 第二步：配置导航菜单

设置网站顶部的导航菜单：

```yaml
stalux:
  navs:
    - title: 首页
      icon: home
      link: /
    - title: 文章
      icon: archive
      link: /archives
    - title: 关于
      icon: user
      link: /about
```

图标名称来自 [Feather Icons](https://feathericons.com/)。

### 第三步：其他可选配置

根据需要配置其他功能，详见各配置专题文档：

- **导航和社交媒体** → 查看《导航和社交媒体配置》
- **友情链接** → 查看《友情链接配置》
- **页脚定制** → 查看《页脚配置详解》
- **评论系统** → 查看《Waline 评论系统配置》

## 配置文件示例

以下是一个最小化的配置示例：

```yaml
stalux:
  title: 我的博客
  url: https://yourdomain.com
  description: 欢迎来到我的博客
  favicon: /favicon.svg
  
  author:
    name: 张三
    avatar: /avatar.png
    bio: 热爱技术的开发者
  
  navs:
    - title: 首页
      icon: home
      link: /
    - title: 关于
      icon: user
      link: /about
  
  typetexts:
    - "Hello World!"
    - "欢迎访问我的博客"
  
  mediaLinks:
    - icon: github
      link: https://github.com/yourusername
  
  links:
    title: 友情链接
    description: 我的朋友们
    sites:
      - name: Astro
        description: 静态网站生成器
        link: https://astro.build/
        icon: https://astro.build/favicon.svg
  
  footer:
    buildtime: "2025-01-01T00:00:00"
    copyright:
      enabled: true
      startYear: 2025
```

## 配置验证

Stalux 使用 TypeScript 和 Zod 进行配置验证：

- ✅ **必填字段检查**: 缺少必填项时会在构建时报错
- ✅ **格式验证**: URL、日期等格式不正确时会提示
- ✅ **类型安全**: TypeScript 提供完整的类型提示

如果配置有误，运行 `bun run dev` 时会看到详细的错误信息。

## 下一步

现在你已经了解了 Stalux 的配置系统，接下来可以：

1. 📖 阅读各配置专题文档，深入了解每个功能
2. ✏️ 开始写作你的第一篇文章（查看《Markdown 文件配置》）
3. 🎨 定制页面样式和布局
4. 🚀 部署你的博客到 Vercel、Netlify 等平台

有任何问题欢迎查阅文档或提交 Issue！
