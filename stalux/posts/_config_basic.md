---
title: 站点基本信息配置
tags:
    - 配置
    - 基本配置
categories:
    - 主题配置
date: 2025-5-10T11:00:00+08:00
updated: 2025-5-10T11:00:00+08:00
abbrlink: ad81245d
---

## 核心站点信息配置

在 `_stalux.yml` 中，您可以配置以下基本信息，这些配置将影响网站的整体标识和 SEO 表现：

```yaml title="_stalux.yml"
# 核心站点信息
title: "Stalux博客主题"
titleDefault: "Stalux博客主题"
siteName: "Stalux博客主题"
author: "xingwangzhe"

# SEO 核心配置
description: "博客主题Stalux - 为内容创作者提供的专业展示平台，支持多种自定义功能，包含评论系统集成、友情链接管理、社交媒体分享和丰富的SEO优化选项，让您的内容更具吸引力和可发现性。"
short_description: "博客主题Stalux"
url: "https://stalux.needhelp.icu"
keywords: "Stalux, 博客主题, 内容创作, Astro主题, 静态网站生成器, SEO优化, 自定义博客, 响应式设计, 评论系统, 前端开发, Astro"
lang: "zh-CN"
locale: "zh_CN"
canonical: "https://stalux.needhelp.icu"
```

### 标题配置

- **`title`**: 网站主标题，用于页面标题显示
- **`titleDefault`**: 默认标题，当页面没有特定标题时使用
- **`siteName`**: 站点名称，用于品牌标识

建议将这些字段设置为您的网站名称，以保持一致性。

### 作者信息

```yaml
author: "xingwangzhe"
```

作者信息将显示在网站页脚和元数据中，确保填写准确的作者名称。

## 站点资源配置

```yaml title="_stalux.yml"
# 站点资源配置
favicon: ""
avatarPath: ""
```

- **`favicon`**: 网站图标路径，建议使用 `.ico` 或 `.png` 格式
- **`avatarPath`**: 作者头像路径，用于网站头像显示

## SEO 配置详解

SEO 配置是提升网站搜索引擎可见性的关键部分：

### 描述和关键词

- **`description`**: 网站描述，建议 150-160 字符，包含核心关键词
- **`keywords`**: 关键词列表，使用逗号分隔的相关关键词

### URL 和规范链接

- **`url`**: 完整的网站 URL，必须包含 `https://` 协议
- **`canonical`**: 规范链接 URL，用于防止重复内容问题

### 语言和地区设置

- **`lang`**: 网站主要语言，使用标准语言代码（如 `zh-CN`）
- **`locale`**: 内容地区设置（如 `zh_CN`），有助于本地化 SEO

## 配置建议

1. **保持一致性**：在所有标题字段中使用相同的网站名称
2. **SEO 优化**：编写吸引人的描述，包含目标关键词
3. **完整 URL**：确保 URL 配置包含完整的协议和域名
4. **语言设置**：根据目标受众选择合适的语言和地区代码

通过合理配置这些基本信息，您可以为网站建立良好的品牌形象并提升 SEO 效果。