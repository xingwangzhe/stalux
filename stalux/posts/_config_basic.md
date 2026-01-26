---
title: 站点基本信息
tags:
  - 配置
  - 基本配置
categories:
  - 主题配置
date: 2025-5-10T11:00:00+08:00
updated: 2026-1-26T11:00:00+08:00
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

## 内容合集

与默认的Astro 内容合集所在文件夹不同, **Stalux** 默认的内容合集文件夹为根目录的`stalux`文件夹, 该文件夹存在两个子文件夹: `about`和`posts`, 分别存放关于页面的`.md`文件和文章页面的`.md`文件。

### frontmatter 配置

对于`posts`文件夹中的文章`.md`文件, 需要在frontmatter中添加以下配置:

```markdown title="posts/*.md 的示例"
---
title: 文章标题
abbrlink: 唯一标识符
date: 2024-01-01T12:00:00+08:00
updated: 2024-01-02T12:00:00+08:00
tags:
- 标签1
- 标签2
  categories:
- 分类1
---
```

```markdown title="about/*.md 的示例"
---
title: 名称,
description: 描述,
---
```

### frontmatter 字段说明

本主题是适应Hexo风格的frontmatter字段, 主要字段说明如下:

对于`posts`文件夹中的文章`.md`文件:

- `title`: 文章标题
- `abbrlink`: 文章的唯一标识符, 用于生成文章链接 路由为`/posts/{abbrlink}`
- `date`: 文章的发布日期, 格式为`YYYY-MM-DDTHH:MM:SS+08:00` 或者简单地写成 `YYYY-MM-DD HH:MM:SS`
- `updated`: 文章的最后更新日期, 格式同上
- `tags`: 文章的标签列表
- `categories`: 文章的分类列表

对于`about`文件夹中的关于页面`.md`文件:

- `title`: 关于页面的名称
- `description`: 关于页面的描述
