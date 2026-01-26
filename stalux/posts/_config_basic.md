---
title: 站点基本信息
tags:
  - 配置
  - 基本配置
categories:
  - 主题配置
date: 2025-5-10T11:00:00+08:00
updated: 2026-1-26T12:00:00+08:00
abbrlink: ad81245d
---

## 主要文件结构

```bash
stalux/
├── public/  # 公共资源文件夹
├── src/
│   ├── assets/  #静态资源,一般不动
│   ├── components/ # 组件
│   │   └── stalux/ # 主题组件
│   │       ├── archives/ # 归档
│   │       ├── categories/ # 分类
│   │       ├── common/ # 通用组件
│   │       ├── footer/ # 底部
│   │       ├── layout/ # 布局
│   │       ├── links/  # 友链
│   │       ├── posts/  # 文章
│   │       └── tags/   # 标签
│   ├── layouts/ # 布局文件
│   ├── pages/ # 页面文件
│   │   ├── api/ # API 文件夹
│   │   ├── categories/ # 分类页面
│   │   ├── posts/ # 文章页面
│   │   └── tags/ # 标签页面
│   ├── scripts/ # 脚本文件
│   ├── styles/
│   │   ├── base/ # 基础样式
│   │   ├── components/ # 组件样式
│   │   │   ├── archives/ # 归档
│   │   │   ├── categories/ # 分类
│   │   │   ├── common/ # 通用组件
│   │   │   ├── footer/ # 底部
│   │   │   ├── layout/ # 布局
│   │   │   ├── links/  # 友链
│   │   │   ├── markdown.css # markdown 样式
│   │   │   ├── posts/  # 文章
│   │   │   ├── search.css # 搜索样式
│   │   │   ├── tags/   # 标签
│   │   └── pages/ # 页面样式
│   ├── utils/ # 工具文件
│   └── content.config.ts # 内容配置文件
├── stalux
│   ├── about/ # 关于 .md
│   ├── posts/ # 文章 .md
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── README.md
└── (其他文件)
```

## 内容合集位置

内容集合使用 `astro:content`，默认存放在根目录 `stalux/` 下：

- `stalux/posts/`：文章 Markdown/MDX，受 posts 集合 schema 约束。
- `stalux/about/`：关于页面 Markdown/MDX，受 about 集合 schema 约束。

## posts/\*.md frontmatter

必填：

- `title`: 文章标题。
- `abbrlink`: 永久链接标识，字符串或数字（数字会自动转为字符串）；用于生成 `/posts/{abbrlink}` 路由。
- `date`: 发布时间，支持 ISO 8601 格式（如 `2025-05-10T09:30:00+08:00`）或 `YYYY-MM-DD HH:mm:ss` 格式。

可选：

- `updated`: 更新日期，字符串或 Date，可为空。
- `tags`: 标签数组；单字符串也会被转换为数组。
- `categories`: 分类数组；单字符串也会被转换为数组。
- `cc`: 版权标识，默认 `CC-BY-NC-SA-4.0`。

示例：

```markdown
---
title: 示例文章
abbrlink: sample-post
date: 2025-05-10T12:00:00+08:00
updated: 2025-05-12T09:00:00+08:00
tags:
  - 技术
  - 随笔
categories:
  - 前端
cc: CC-BY-NC-SA-4.0
draft: false
---

正文...
```

## about/\*.md frontmatter

必填：

- `title`: 页面标题。
- `description`: 页面描述（用于页面简介/SEO）。

示例：

```markdown
---
title: 关于本站
description: 个人简介与站点信息
---

内容...
```

## 书写注意

- frontmatter 顶部使用 `---` 包裹；冒号后留空格，数组/对象保持缩进。
- 建议日期使用 ISO 8601（含时区偏移），便于排序和显示。
- abbrlink 建议自定义字符串以保证链接稳定，不依赖标题。
