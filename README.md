# Stalux - 高效、美观、灵活的 ## 📦 主题结构

Stalux 主题采用清晰的项目结构，便于管理和定制:

```text
├── public/              # 静态资源 (图片、字体等)
├── src/
│   ├── _config.ts       # 自定义配置文件
│   ├── components/      # UI组件
│   ├── content/         # 内容集合 (博客文章、关于页面)
│   │   ├── posts/       # 博客文章
│   │   └── about/       # 关于页面
│   ├── consts.ts        # 默认配置常量
│   ├── layouts/         # 页面布局组件
│   ├── pages/           # 页面定义
│   ├── styles/          # 全局样式
│   ├── types.ts         # TypeScript类型定义
│   └── utils/           # 工具函数
├── astro.config.mjs     # Astro 配置
└── tsconfig.json        # TypeScript 配置
```Stalux博客主题](https://github.com/withastro/astro/assets/2244813/ff10799f-a816-4703-b967-c78997e8323d)

> 简单，但不简陋；美观，但不浮华。

Stalux 是一款基于 Astro 框架开发的静态博客主题，专为内容创作者设计，追求高性能、美观直观的用户界面与灵活的配置系统。主题名称"Stalux"中的"Sta"代表静态（Static），"lux"代表奢华（Luxury）的外观体验

~~其实是我瞎编的~~

## ✨ 特性

- **🚀 极致性能** - 基于 Astro 构建，100/100 Lighthouse 性能评分
- **🎨 美观直观** - 精心设计的界面，提供清晰的阅读体验
- **⚙️ 灵活配置** - 丰富的自定义选项，通过 `_config.ts` 轻松配置
- **📱 响应式设计** - 在各种设备上提供出色体验
- **🌓 暗色模式** - 内置浅色/深色主题切换功能
- **💬 评论系统** - 集成 Waline 评论系统，轻量且功能丰富
- **🔍 SEO优化** - 内置多种SEO优化技术，提高搜索引擎可见性
- **📰 RSS 支持** - 自动生成 RSS 订阅源
- **🗺️ 站点地图** - 自动生成站点地图，提升 SEO
- **📝 Markdown & MDX** - 支持丰富的 Markdown 和 MDX 内容创作

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

## 🚀 开始使用

### 安装依赖

```bash
pnpm install
```

### 开发服务器

```bash
pnpm dev
```

启动后访问 `http://localhost:4321` 查看您的站点。

### 构建项目

```bash
pnpm build
```

生成的静态文件将位于 `./dist/` 目录。

### 预览构建结果

```bash
pnpm preview
```

## 📝 内容创作

Stalux 支持通过 Markdown 和 MDX 创建内容，文件放置在 `src/content/` 目录下:

- **博客文章**: 在 `src/content/posts/` 中创建 `.md` 或 `.mdx` 文件
- **关于页面**: 在 `src/content/about/` 中创建 `.md` 或 `.mdx` 文件

### Frontmatter 配置

每个 Markdown 文件需要在顶部添加 frontmatter 配置:

```markdown
---
title: 文章标题
tags:
    - 标签1
    - 标签2
categories:
    - 分类
date: 2025-5-10T10:00:00+08:00
description: 文章描述，用于SEO
cover: /images/cover.jpg
---

文章内容...
```

## ⚙️ 主题配置

Stalux 提供了灵活的配置系统，通过修改 `src/_config.ts` 文件进行自定义:

1. 将 `useConfig` 设置为 `true` 以启用自定义配置
2. 修改 `siteConfig` 对象中的各项配置

```typescript
// src/_config.ts
export const useConfig: boolean = true;

export const siteConfig: SiteConfig = {
  // 站点基本信息
  title: '我的博客',
  siteName: '我的博客',
  author: '作者名',
  description: '博客描述...',
  
  // 其他配置...
}
```

详细配置项可参考主题文档中的配置指南。

## 🌐 部署

Stalux 主题生成的是纯静态网站，可以轻松部署到:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [GitHub Pages](https://pages.github.com/)
- 任何支持静态网站的托管服务

## 🧞 常用命令

所有命令在项目根目录下运行:

| 命令                     | 功能                                             |
| :----------------------- | :----------------------------------------------- |
| `pnpm install`           | 安装依赖                                         |
| `pnpm dev`               | 启动本地开发服务器，地址为 `localhost:4321`      |
| `pnpm build`             | 构建生产站点到 `./dist/` 目录                    |
| `pnpm preview`           | 在部署前本地预览构建结果                         |
| `pnpm astro ...`         | 运行CLI命令，如 `astro add`, `astro check`       |

## 🙏 致谢

Stalux 主题基于 Astro 框架开发，同时受到多个优秀开源项目的启发。特别感谢:

- [Astro](https://astro.build/) - 提供了强大的静态站点生成框架
- [Waline](https://waline.js.org/) - 提供了轻量级评论系统
- 所有为此项目贡献代码和想法的贡献者

## 📄 许可证

Stalux 主题基于 MIT 许可证开源，您可以自由地使用、修改和分发。

---

开始使用 Stalux 创建您的博客，展示您的创意与知识吧！如有问题或建议，欢迎通过 GitHub 提交 Issue 或 Pull Request。
