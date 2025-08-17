# Stalux - Astro 博客主题

<div align="center">

![Stalux 主题图标](src/images/stalux.ico)
</div>

<p align="center">
  一个简洁实用的 Astro 博客主题
</p>

Stalux 是一个基于 Astro 构建的静态博客主题，适用于个人博客搭建。它提供了一些基础功能，如文章展示、分类标签、评论系统等。

## 项目结构

```
├── public/              # 静态资源
├── src/
│   ├── _config.ts       # 自定义配置文件（可以参考 _config.ts.template）
│   ├── components/      # UI 组件
│   ├── content/         # 内容目录
│   │   ├── posts/       # 博客文章
│   │   └── about/       # 关于页面
│   ├── consts.ts        # 默认配置常量
│   ├── layouts/         # 页面布局组件
│   ├── pages/           # 页面路由
│   ├── styles/          # 全局样式
│   ├── types.ts         # TypeScript 类型定义
│   └── utils/           # 工具函数
├── astro.config.mjs     # Astro 配置文件
└── tsconfig.json        # TypeScript 配置
```

## 功能特性

- 基于 Astro v5 构建
- 支持 Markdown 和 MDX 格式写作
- 响应式设计，适配移动端
- 支持暗色/亮色主题切换
- 集成 Waline 评论系统
- 自动生成 RSS 和站点地图
- 支持代码高亮（使用 Expressive Code）
- 支持数学公式（KaTeX）
- 支持文章目录自动生成
- 可自定义的导航、社交链接等

## 快速开始

### 安装

推荐使用 [Bun](https://bun.sh) 来获得更快的依赖安装和构建速度。你也可以使用 npm、yarn 或 pnpm。

```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog
cd my-blog
bun install
```

或者使用 npm：

```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog
cd my-blog
npm install
```

### 开发

使用 Bun（推荐）：

```bash
bun run dev
```

或者使用 npm：

```bash
npm run dev
```

访问 `http://localhost:4321` 预览博客。

### 构建

使用 Bun（推荐）：

```bash
bun run build
```

或者使用 npm：

```bash
npm run build
```

构建后的静态文件将生成在 `dist/` 目录中。

### 配置

项目采用"按需自定义"的配置哲学，默认使用 [consts.ts](file:///home/xingwangzhe/桌面/stalux/src/consts.ts) 中的配置，用户可以创建自定义配置文件来覆盖默认配置：

1. 参考模板创建自定义配置文件：
   ```bash
   cp src/_config.ts.template src/_config.ts
   ```

2. 在 [src/_config.ts](file:///home/xingwangzhe/桌面/stalux/src/_config.ts) 中设置启用自定义配置并修改配置项：
   ```typescript
   export const useConfig: boolean = true; // 启用自定义配置

   export const siteConfig: SiteConfig = {
     titleDefault: '你的博客名称',
     siteName: '你的博客名称',
     author: '你的名字',
     description: '博客描述',
     // ... 其他需要自定义的配置
   }
   ```

如果不创建 [src/_config.ts](file:///home/xingwangzhe/桌面/stalux/src/_config.ts) 文件，项目将直接使用 [consts.ts](file:///home/xingwangzhe/桌面/stalux/src/consts.ts) 中的默认配置。

## 写作

在 `src/content/posts/` 目录下创建 Markdown 文件：

```
---
title: 我的第一篇文章
description: 文章描述
pubDate: 2025-01-01
---

文章内容...

```

支持的 Frontmatter 字段：
- `title` - 文章标题(必需)
- `description` - 文章描述 (可选)
- `pubDate` - 发布日期 (可选，默认为文件创建时间)
- `updatedDate` - 更新日期 (可选，默认为文件更新时间)
- `cover` - 封面图片 (可选，但尚未使用)
- `tags` - 标签数组 (必需)
- `categories` - 分类数组 (必需)
- `draft` - 是否为草稿 (可选，尚未使用)

## 部署

可部署到 Vercel、Netlify、GitHub Pages 等支持静态网站的平台。

### Vercel

1. 在 Vercel 中导入项目
2. 设置构建命令为 `bun run build`（推荐）或 `npm run build`
3. 设置输出目录为 `dist`

### GitHub Pages

1. 修改 [astro.config.mjs](file:///home/xingwangzhe/桌面/stalux/astro.config.mjs) 中的 `site` 配置为你的 GitHub Pages URL
2. 配置 GitHub Actions 进行自动部署

## 许可证

MIT