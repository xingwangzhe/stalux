---
title: 页脚配置详解
tags:
  - 配置
  - 页脚
categories:
  - 主题配置
date: 2025-5-10T15:00:00+8:00
updated: 2026-1-26T12:00:00+8:00
abbrlink: dd30cf92
---

## 概要

页脚字段来自 config.yml 的 `footer` 节，默认值如下，发布后不依赖项目内相对链接：

```yaml
footer:
  buildtime: "2025-05-01T10:00:00"
  copyright:
    enabled: true
    startYear: 2024
    customText: ""
  theme:
    showPoweredBy: true
    showThemeInfo: true
  beian:
    icp:
      enabled: false
      number: "辽ICP备XXXXXXXX号"
    security:
      enabled: false
      text: "辽公网安备 XXXXXXXXXXXX号"
      number: "XXXXXXXXXXXX"
  badges:
    - {
        label: "Powered by",
        message: "Astro",
        color: "orange",
        style: "flat-square",
        alt: "Powered by Astro",
        href: "https://astro.build/",
      }
    - {
        label: "Theme",
        message: "Stalux",
        color: "blueviolet",
        alt: "Theme: Stalux",
        href: "https://github.com/xingwangzhe/stalux",
      }
    - {
        label: "Built with",
        message: "❤",
        color: "red",
        style: "for-the-badge",
        alt: "Built with Love",
        href: "https://github.com/xingwangzhe",
      }
    - {
        label: "license",
        message: "MIT",
        color: "blue",
        alt: "License: MIT",
        href: "https://github.com/xingwangzhe/stalux/blob/main/LICENSE",
      }
    - {
        label: "软著",
        message: "登记号 2025SR2258474",
        color: "yellowgreen",
        alt: "软件著作权登记号 2025SR2258474",
        href: "/软著证明.pdf",
      }
    - {
        label: "阿里云ESA",
        message: "支持",
        color: "brightgreen",
        alt: "阿里云ESA",
        href: "https://www.aliyun.com/product/esa",
      }
    - {
        label: "Sitemap",
        message: "XML",
        color: "orange",
        alt: "Sitemap XML",
        href: "/sitemap-index.xml",
      }
    - { label: "RSS", message: "Feed", color: "orange", alt: "RSS Feed", href: "/rss.xml" }
    - { label: "Atom", message: "Feed", color: "orange", alt: "Atom Feed", href: "/atom.xml" }
    - { label: "LLMs", message: "Dataset", color: "blue", alt: "LLM Dataset", href: "/llms.txt" }
  custom: |
    <!-- footer自定义插槽示例，可放统计、挂件等 -->
    <div id="custom-footer-hook"></div>
    <script>console.log('自定义footer已加载');</script>
```

## 字段说明

- `buildtime`: 构建时间字符串，用于前端显示站点运行时长；建议填实际部署时间。
- `copyright`: 版权区开关、起始年和自定义文案；`enabled` 关闭后不显示版权。
- `theme`: 是否显示 Powered by / Theme 信息。
- `beian`: ICP 与公安备案的开关和编号；仅在 `enabled` 为 true 时显示。
- `badges`: 徽章数组，属性包括 `label`、`message`、`color`、`style`（如 flat-square/for-the-badge）、`alt`、`href`。
- `custom`: 自定义 HTML 片段插入页脚，可用于统计或挂件。

## 常见操作

- 更新备案号：开启对应 `enabled` 并填写号码/文本。
- 精简徽章：删除不需要的项，保持与站点相关。
- 自定义版权文案：填写 `customText` 或调整 `startYear` 与当前年份匹配。
- 添加脚本：将统计/验证代码放入 `custom`；注意仅插入可信脚本，避免跨域安全风险。
