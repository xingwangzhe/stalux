---
title: 自定义head与header导航
tags:
    - 配置
    - 自定义
categories:
    - 主题配置
    - 布局定制
date: "2025-05-10 12:00:00"
updated: "2026-02-03 12:00:00"
abbrlink: 0035a0ee
---

## head 自定义与分析工具

使用 config.yml 的 `head` 字段配置网站分析工具（Google Analytics、Bing Clarity、Umami）和自定义头部内容：

```yaml
head:
    # Google Analytics 4 跟踪 ID (格式: G-XXXXXXXXXX)
    googleAnalyticsId: "G-XXXXXXXXXX"

    # Microsoft Bing Clarity 项目 ID
    bingClarityId: "your-clarity-id"

    # Umami 分析配置
    umami:
        id: "your-umami-website-id" # 网站 ID
        url: "https://umami.example.com/umami.js" # Umami 脚本 URL

    # 额外自定义头部内容（HTML字符串）
    anyhead: |
        <!-- 自定义样式 -->
        <style>:root { --theme-color: #42b883; }</style>
        <!-- 其他自定义脚本 -->
```

### 分析工具说明

- **Google Analytics**: 只需填写 `googleAnalyticsId`，主题会自动加载 GA4 脚本
- **Bing Clarity**: 填写 `bingClarityId`，主题会自动加载 Microsoft Clarity 跟踪代码
- **Umami**: 需要同时填写 `id`（网站ID）和 `url`（脚本地址）

所有分析脚本都使用 `partytown` 在 Web Worker 中运行，不会影响页面性能。

### 旧版配置迁移

之前使用 `anyhead` 直接插入脚本的用户，建议迁移到新的结构化配置：

- 删除 `anyhead` 中的分析脚本
- 将对应的跟踪 ID 填入相应的配置字段
- 保留其他自定义内容在 `anyhead` 中

## header 导航

导航配置来自 config.yml 的 `navs` 数组：

```yaml
navs:
    - title: 首页
      icon: home
      link: /
    - title: 文章
      icon: archive
      link: /archives
    - title: 分类
      icon: folder
      link: /categories
    - title: 标签
      icon: tag
      link: /tags
    - title: 一言
      icon: quote
      link: /words
    - title: 友链
      icon: link
      link: /links
    - title: 关于
      icon: user
      link: /about
    - title: 开往
      icon: train-front
      link: https://www.travellings.cn/go
```

说明：

- `link` 支持站内路径或完整外链；`icon` 使用 [Lucide Icons](https://lucide.dev/icons/) 标准名称（如 `home`、`train-front`）。
- 需要新增导航项时，按相同结构追加；搜索入口已内置，无需手动配置。

## 常见操作

- 添加分析工具：在 `head` 下配置对应的跟踪 ID，无需手动编写脚本。
- 添加自定义头部内容：使用 `head.anyhead` 插入额外的 HTML 片段。
- 新增导航：在 `navs` 末尾追加项，外链需包含协议（https://）。
- 更换 favicon：修改 config.yml 中的 `favicon` 路径（支持绝对或站点内路径）。
