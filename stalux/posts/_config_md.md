---
title: Markdown文件配置参考
tags:
    - 配置
    - Markdown
    - 内容创作
categories:
    - 主题配置
date: 2025-5-10T16:00:00+08:00
updated: 2025-5-10T16:00:00+08:00
abbrlink: f31dae4f
---

## Markdown文件配置说明

Stalux主题支持使用Markdown文件创建博客文章和页面。每个Markdown文件需要配置frontmatter（文件顶部的元数据部分），以便主题正确处理和展示内容。

本文将详细介绍Markdown文件的frontmatter配置选项，帮助您更好地组织和管理内容。关键配置在`src>content.config.ts`中定义。

## 博客文章配置 (posts/*.md)

为每篇博客文章添加frontmatter，按以下格式：
```ts title="content.config.ts"
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    // 接受日期字符串或 Date 对象
    date: z.union([z.string(), z.coerce.date()]).optional(),
    // 更新时间可选，接受日期字符串或 Date 对象
    updated: z.union([z.string(), z.coerce.date()]).optional(),
    // 自定义描述字段，用于 SEO
    description: z.string().optional(),
    // 摘要字段，如果没有描述，则用作备选
    excerpt: z.string().optional(),
    // 文章封面图
    cover: z.string().optional(),
    // 文章作者
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    // 分类支持多种格式的数组
    categories: z.array(categorySchema).optional(),
    abbrlink: z.union([z.string(), z.number()]).optional(),
    // 是否不被搜索引擎索引
    noindex: z.boolean().optional().default(false),
  }),
});
```

### 必要字段说明

对于博主来说，以下是最常用的frontmatter字段：

- **`title`**: 文章标题，必填项
- **`tags`**: 文章标签，建议设置1-5个相关标签，有助于内容分类
- **`categories`**: 文章分类，可以设置单个或多个分类
- **`date`**: 发布日期，建议使用`YYYY-MM-DDTHH:MM:SS+08:00`格式
- **`updated`**: 更新日期，可选，用于显示文章的最后修改时间

### 永久链接设置

- **`abbrlink`**: 文章的永久链接，默认使用sha256算法取前8位生成，您也可以手动设置。永久链接有助于维护URL的稳定性，即使文章标题变更，链接仍保持不变。

### 可选字段说明

以下字段为可选配置：

- **`description`**: 文章描述，用于SEO和社交媒体分享
- **`excerpt`**: 文章摘要，如果没有设置description，则用作替代
- **`cover`**: 文章封面图片路径，会在文章列表和详情页显示
- **`author`**: 文章作者，如果未设置则使用站点默认作者
- **`noindex`**: 设置为`true`将告诉搜索引擎不要索引此文章，默认为`false`

## 关于页面配置 (about/*.md)

Stalux主题支持创建多个关于页面，每个页面可以通过frontmatter配置其显示顺序和内容：

```ts title="content.config.ts"
const about = defineCollection({
  loader: glob({ base: './src/content/about', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(), // 页面描述，用于SEO
    priority: z.number().default(1), // 优先级，数字越大优先级越高
  }),
});
```

### 关于页面frontmatter字段

- **`title`**: 页面标题，必填项
- **`description`**: 页面描述，用于SEO，可选
- **`priority`**: 页面优先级，数字越大显示越靠前，默认为1

## 实际应用示例

### 博客文章示例

```markdown
---
title: Astro框架入门指南
tags:
    - Astro
    - 前端
    - 静态站点
categories:
    - 技术教程
    - Web开发
date: 2025-5-10T09:30:00+08:00
description: 本文详细介绍了Astro框架的基本概念、安装方法和使用技巧，帮助前端开发者快速上手这一强大的静态站点生成器。
cover: /images/astro-guide-cover.jpg
---

这里是文章正文内容...
```

### 关于页面示例

```markdown
---
title: 关于博主
description: 个人简介、技能和联系方式
priority: -1
---

这里是关于博主的详细介绍...
```
priority是优先级,数字越大就会被about页面渲染,这意味这你不用变动`default.md`文件,而是直接在同级目录下创建md文件即可实现自己的about页面

## 注意事项

1. frontmatter必须位于Markdown文件的最顶部，并用三个连字符(`---`)包围
2. 字段名称和值之间使用冒号(`:`)分隔，并确保冒号后有一个空格
3. 嵌套数据(如数组)需要正确缩进
4. 日期格式推荐使用ISO 8601标准(`YYYY-MM-DDTHH:MM:SS+08:00`)

适当配置frontmatter可以让您的内容组织更加清晰，也有助于提升网站的SEO表现和用户体验。
