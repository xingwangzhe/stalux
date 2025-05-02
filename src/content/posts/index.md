---
title: "Stalux主题配置文档"
date: 2023-09-01
description: "Stalux主题的完整配置指南，包括基础设置、高级功能和常见问题解答"
tags: ["文档", "配置", "入门"]
categories: ["文档"]
---

# Stalux主题配置文档

欢迎使用Stalux主题！这是一个为Astro构建的现代博客主题，专注于性能、SEO和用户体验。本文档将帮助你快速上手并配置Stalux主题。

## 文档目录

1. [基础配置](./basic-config.md) - 主题的基本配置选项
2. [高级配置](./advanced-config.md) - 更深入的自定义选项
3. [评论系统配置](./comment-config.md) - 如何设置评论功能
4. [SEO优化配置](./seo-config.md) - 搜索引擎优化指南
5. [Frontmatter指南](./frontmatter-guide.md) - 文章和页面Frontmatter字段详解

## 快速开始

### 安装

```bash
# 使用NPM
npm install stalux-theme

# 或使用Yarn
yarn add stalux-theme

# 或使用PNPM
pnpm add stalux-theme
```

### 基本配置

创建配置文件`src/_config.ts`：

```typescript
// src/_config.ts
import type { SiteConfig } from './types';

export const config_site: Partial<SiteConfig> = {
  title: '我的博客',
  description: '基于Stalux主题的个人博客',
  url: 'https://yourdomain.com',
  author: '你的名字',
};
```

### 创建你的第一篇文章

在`src/content/posts`目录下创建Markdown文件：

```markdown
---
title: 我的第一篇文章
date: 2023-09-01
tags: [入门, 博客]
categories: [教程]
description: 这是我使用Stalux主题发布的第一篇文章
---

# 你好，世界！

这是我的第一篇博客文章。使用Stalux主题让写作变得如此简单！

## 特性

- 优秀的排版
- 高性能
- SEO友好
- 响应式设计
```

## 主题特性

Stalux主题提供以下特性：

- 📝 基于Markdown的内容创作
- 🔍 优化的SEO设置
- 💬 集成多种评论系统
- 📊 页面访问统计
- 🌓 明暗模式切换
- 📱 响应式布局设计
- 🔎 全站搜索功能
- 🏷️ 标签和分类管理
- 📅 文章归档
- 🔗 友情链接页面
- 📰 RSS订阅支持

## 自定义主题

Stalux主题设计为易于扩展和自定义。请参阅[高级配置](./advanced-config.md)文档了解更多自定义选项。

## 贡献与支持

如果你发现任何问题或有改进建议，请在GitHub仓库提交issue或PR。

- GitHub仓库：[https://github.com/yourusername/stalux](https://github.com/yourusername/stalux)
- 演示网站：[https://stalux.needhelp.icu](https://stalux.needhelp.icu)

## 许可证

Stalux主题基于MIT许可证开源。
