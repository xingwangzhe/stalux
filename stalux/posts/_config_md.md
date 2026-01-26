---
title: Markdown文件配置参考
tags:
  - 配置
  - Markdown
  - 内容创作
categories:
  - 主题配置
date: 2025-5-10T16:00:00+08:00
updated: 2026-1-26T00:00:00+08:00
abbrlink: f31dae4f
---

## 概要

本篇按照当前 schema（见 src/content.config.ts）重写，列出 posts 与 about 的 frontmatter 要求及示例。避免使用项目内相对链接，确保发布到站点时不会出现无效链接。

## posts/\*.md frontmatter

loader: base 为 `stalux/posts/`，pattern `*.md`/`*.mdx`。

必填字段：

- `title`: 文章标题。
- `abbrlink`: 永久链接，支持字符串或数字（数字会自动转为字符串）。建议手动设置保持 URL 稳定。
- `date`: 发布时间，支持 ISO 8601 格式字符串（如 `2025-05-10T09:30:00+08:00`）或 `YYYY-MM-DD HH:mm:ss` 格式，构建时会转为 Date 对象。

可选字段：

- `updated`: 更新日期，字符串或 Date，未填则不显示更新时间。
- `draft`: 布尔，默认 false；为 true 时可用于本地草稿控制。
- `tags`: 标签数组，字符串或单个字符串会被预处理为数组。
- `categories`: 分类数组，字符串或单个字符串会被预处理为数组。
- `cc`: 版权标识，默认 `CC-BY-NC-SA-4.0`。

示例：

```markdown
---
title: Astro 入门指南
abbrlink: astro-guide
date: 2025-05-10T09:30:00+08:00
updated: 2025-05-12T18:00:00+08:00
tags:
  - Astro
  - 前端
categories:
  - 技术教程
cc: CC-BY-NC-SA-4.0
draft: false
---

正文内容...
```

书写提示：

- 日期推荐使用 ISO 8601（例：`2025-05-10T09:30:00+08:00`）或 `YYYY-MM-DD HH:mm:ss` 格式。
- `abbrlink` 可以是字符串（如 `"astro-guide"`）或数字（如 `123456`），数字会自动转为字符串。
- `tags`/`categories` 支持单个字符串或数组，内部会自动转成数组。
- 未提供 `cc` 时采用默认值 `CC-BY-NC-SA-4.0`；若不需要版权声明，可设为空字符串。

## about/\*.md frontmatter

loader: base 为 `stalux/about/`，pattern `**/*.{md,mdx}`。

字段：

- `title` 必填。
- `description` 必填（用于页面描述/SEO）。

示例：

```markdown
---
title: 关于博主
description: 个人简介、技能与联系方式
---

这里是关于页面正文...
```

## 写作与校验

- frontmatter 放在文件顶部，使用三根短横线包裹。
- 冒号后留空格，数组/对象保持正确缩进。
- 保存后运行 `bun run dev`，如有必填缺失或类型不符，构建日志会提示具体字段。
