---
title: 自定义head与header导航
tags:
  - 配置
  - 自定义
categories:
  - 主题配置
  - 布局定制
date: 2025-5-10T12:00:00+08:00
updated: 2026-1-26T12:00:00+08:00
abbrlink: 0035a0ee
---

## head 自定义

使用 config.yml 的 `anyhead` 字段可插入额外的 `<head>` 片段（HTML 字符串）。示例：

```yaml
anyhead: |
  <!-- 统计或验证脚本 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-XXXX');
  </script>

  <!-- 自定义样式 -->
  <style>:root { --theme-color: #42b883; }</style>
```

提示：仅插入可信脚本，避免影响隐私与性能；favicon 已由 `favicon` 字段统一控制。

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
  - title: 友链
    icon: link
    link: /links
  - title: 关于
    icon: user
    link: /about
  - title: 开往
    icon: airplay
    link: https://www.travellings.cn/go
```

说明：

- `link` 支持站内路径或完整外链；`icon` 使用 Feather Icons 名称。
- 需要新增导航项时，按相同结构追加；搜索入口已内置，无需手动配置。

## 常见操作

- 添加统计/验证：放入 `anyhead`，发布前在浏览器控制台确认无报错。
- 新增导航：在 `navs` 末尾追加项，外链需包含协议（https://）。
- 更换 favicon：修改 config.yml 中的 `favicon` 路径（支持绝对或站点内路径）。
