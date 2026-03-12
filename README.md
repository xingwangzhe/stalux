**本项目由阿里云ESA提供加速、计算和保护**

![阿里云加速](aliyun.png)

**#阿里云ESA Pages** **#阿里云云工开物话题**

[![Stargazers repo roster for @xingwangzhe/stalux](https://reporoster.com/stars/dark/xingwangzhe/stalux)](https://github.com/xingwangzhe/stalux/stargazers)

[![Forkers repo roster for @xingwangzhe/stalux](https://reporoster.com/forks/dark/xingwangzhe/stalux)](https://github.com/xingwangzhe/stalux/network/members)

# Stalux - 现代 Astro 博客主题

**本博客主题已有[软著](./软著证明.pdf)，受中国版权相关法律保护，请务必遵守 [LICENSE 许可证](./LICENSE)（MIT 协议）**

<p align="center">
  优雅、高性能、易配置的 Astro 静态博客主题
</p>

Stalux 是一个基于 Astro 5 构建的现代静态博客主题，专为内容创作者设计。它提供了完整的博客功能、优秀的 SEO 支持、响应式设计和丰富的自定义选项。

## ✨ 功能特性

### 核心功能

- 🚀 **极致性能** - 基于 Astro 5 静态站点生成，加载速度飞快
- 📱 **完全响应式** - 完美适配桌面、平板和移动设备
- 🎨 **现代设计** - 暗色主题，毛玻璃效果，优雅的视觉体验
- 🔍 **SEO 优化** - 自动生成 sitemap、RSS、Atom feed，完善的 meta 标签
- 🌐 **视图过渡** - 流畅的页面切换动画（可选）
- 🔎 **全站搜索** - 集成 Pagefind 实现快速全文搜索

### 内容功能

- 📝 **Markdown/MDX** - 支持标准 Markdown 和 MDX 格式
- 🏷️ **分类标签** - 完善的分类和标签系统
- 📚 **文章归档** - 按时间线展示所有文章
- 💬 **评论系统** - 集成 Waline 评论系统
- 🔗 **友情链接** - 友链展示页面
- 📖 **目录导航** - 自动生成文章目录
- ⏱️ **阅读时间** - 自动计算文章阅读时长

### 开发体验

- ⚡ **Bun 优先** - 推荐使用 Bun 获得极速构建
- 🎯 **TypeScript** - 完整的类型支持
- 🎨 **CSS Modules** - 组件级样式隔离
- 📦 **零配置** - 开箱即用，可选配置丰富
- 🛠️ **代码高亮** - Expressive Code 提供美观的代码展示
- 🧮 **数学公式** - KaTeX 支持 LaTeX 数学公式
- 📊 **图表支持** - Mermaid 图表渲染

### 增强功能

- 🖼️ **图片灯箱** - PhotoSwipe 图片查看器
- 🎭 **图标支持** - Feather Icons + Simple Icons
- 📱 **社交分享** - 多平台社交媒体链接
- 🏷️ **徽章生成** - 自动生成状态徽章
- 🤖 **LLM 友好** - 自动生成 AI 训练数据集

## 📦 项目结构

```
stalux/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 资源文件
│   ├── components/
│   │   └── stalux/        # 主题组件
│   │       ├── archives/  # 归档组件
│   │       ├── categories/# 分类组件
│   │       ├── common/    # 通用组件
│   │       ├── footer/    # 页脚组件
│   │       ├── layout/    # 布局组件
│   │       ├── links/     # 友链组件
│   │       ├── posts/     # 文章组件
│   │       └── tags/      # 标签组件
│   ├── layouts/           # 页面布局
│   │   ├── PostLayout.astro    # 文章布局
│   │   └── Stalux.astro        # 主布局
│   ├── pages/             # 路由页面
│   │   ├── api/           # API 端点
│   │   ├── categories/    # 分类页面
│   │   ├── posts/         # 文章页面
│   │   ├── tags/          # 标签页面
│   │   ├── atom.xml.ts    # Atom feed
│   │   ├── rss.xml.ts     # RSS feed
│   │   └── *.astro        # 其他页面
│   ├── scripts/           # 客户端脚本
│   ├── styles/            # 样式文件
│   │   ├── base/          # 基础样式
│   │   ├── components/    # 组件样式
│   │   └── pages/         # 页面样式
│   ├── utils/             # 工具函数
│   └── content.config.ts  # 内容集合配置
├── stalux/                # 内容目录
│   ├── about/             # 关于页面
│   └── posts/             # 博客文章
├── astro.config.mjs       # Astro 配置
├── config.yml             # 主题配置文件
├── BACK.yml               # 备份配置
├── template.yml           # 配置模板
└── package.json           # 项目依赖
```

## 🚀 快速开始

### 前置要求

- Node.js 18+ 或 Bun 1.0+
- Git

### 安装

**推荐使用 Bun（性能更优）：**

```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog
cd my-blog
bun install
```

**或使用 npm/pnpm/yarn：**

```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog
cd my-blog
npm install  # 或 pnpm install / yarn install
```

### 开发

```bash
# 使用 Bun（推荐）
bun run dev

# 或使用 npm
npm run dev
```

访问 `http://localhost:4321` 预览博客。

### 构建

```bash
# 使用 Bun（推荐）
bun run build

# 或使用 npm
npm run build
```

构建产物位于 `dist/` 目录。

### 预览

```bash
# 使用 Bun（推荐）
bun run preview

# 或使用 npm
npm run preview
```

## ⚙️ 配置

### 主配置文件

编辑 `config.yml` 进行个性化配置。主要配置项：

```yaml
stalux:
    title: 你的博客名称
    url: https://yourdomain.com
    description: 博客描述

    author:
        name: 作者名
        avatar: /avatar.png
        bio: 个人简介

    navs:
        - title: 首页
          icon: home
          link: /
        # 更多导航项...

    # 评论系统（Waline）
    waline:
        serverURL: https://your-waline-server.com
        # login: 'enable' | 'disable' | 'force'  # 强制登录可防止伪造
        # recaptchaV3Key: ""  # 可选，配置 reCAPTCHA v3 网站 key
        # turnstileKey: ""  # 可选，配置 Cloudflare Turnstile key
        # dark: true  # 是否启用暗色模式适配
        # reaction: false
        # meta: ["nick", "mail", "link"]
        # requiredMeta: []  # 必填字段示例, 可设置为 ['nick'] 或 ['nick','mail']
        # commentSorting: "latest"  # 评论排序方式
        # imageUploader: # 自定义图片上传
        # highlighter: # 自定义代码高亮
        # texRenderer: # 自定义 TeX 渲染
        # search: # 自定义搜索功能

    # 友情链接
    links:
        title: 友情链接
        sites:
            - name: 友链名称
              url: https://example.com
              avatar: /avatar.jpg
              description: 描述

    # 页脚配置
    footer:
        buildtime: "2024-01-01"
        copyright:
            enabled: true
            startYear: 2024
        beian:
            icp: 备案号
```

完整配置参考 `BACK.yml`。

## ✍️ 写作

在 `stalux/posts/` 目录下创建 Markdown 文件：

```markdown
---
title: 文章标题
date: 2024-01-26T00:00:00+08:00
abbrlink: unique-slug
tags:
    - 标签1
    - 标签2
categories:
    - 分类名
---

文章内容...
```

### Frontmatter 字段

必填：

- `title`: 文章标题。
- `abbrlink`: 永久链接标识，字符串或数字（数字会自动转为字符串）；用于生成 `/posts/{abbrlink}` 路由。
- `date`: 发布时间，支持 ISO 8601 格式（如 `2025-05-10T09:30:00+08:00`）或 `YYYY-MM-DD HH:mm:ss` 格式。

可选：

- `updated`: 更新日期，字符串或 Date，可为空。
- `tags`: 标签数组；单字符串也会被转换为数组。
- `categories`: 分类数组；单字符串也会被转换为数组。
- `cc`: 版权标识，默认 `CC-BY-NC-SA-4.0`。

## 🎨 主题

默认只有**暗色主题**

### 组件样式

所有组件使用 CSS Modules，样式文件位于 `src/styles/components/`。

## 🌐 部署

构建完成后，将 `dist/` 目录内容上传到你的静态网站托管服务（如 Vercel、Netlify、GitHub Pages 等）。

## 📄 RSS & Sitemap

配置 `astro.config.mjs` 中的 `site` 为你的 Pages URL

主题自动生成：

- RSS Feed: `/rss.xml`
- Atom Feed: `/atom.xml`
- Sitemap: `/sitemap-index.xml`

订阅地址可在页脚徽章中找到。

## 🛠️ 开发工具

```bash
# 代码格式化
bun run fmt

# 代码检查
bun run lint

# 修复代码问题
bun run lint:fix

# 许可证检查
bun run license-checker
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 许可证

本项目采用 [MIT 许可证](LICENSE)。

**特别说明：** 本主题拥有软件著作权，使用时请遵守 MIT 协议条款。

## 🙏 致谢

- [Astro](https://astro.build/) - 现代静态站点生成器
- [Waline](https://waline.js.org/) - 评论系统
- [Expressive Code](https://expressive-code.com/) - 代码高亮
- [PhotoSwipe](https://photoswipe.com/) - 图片灯箱
- [阿里云 ESA](https://www.aliyun.com/product/esa) - 提供加速和部署支持

## 📧 联系方式

- GitHub: [@xingwangzhe](https://github.com/xingwangzhe)
- 主题文档: [stalux.needhelp.icu](https://stalux.needhelp.icu)
- 问题反馈: [GitHub Issues](https://github.com/xingwangzhe/stalux/issues)

---

如果觉得这个主题不错，请给个 ⭐️ Star 支持一下！
