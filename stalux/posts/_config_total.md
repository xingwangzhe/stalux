---
title: Stalux 主题配置总览
tags:
    - 配置
    - 入门
categories:
    - 主题配置
date: "2025-05-10 10:00:00"
updated: "2026-02-03 00:00:00"
abbrlink: 0b563d42
---

## 配置文件位置

- 主配置: config.yml
- 配置结构定义: src/content.config.ts
- 其他专题说明: 位于 stalux/posts 下的 `_config_*.md`

## 当前默认配置（摘录）

```yaml
stalux:
    title: "Stalux博客主题"
    url: "https://stalux.needhelp.icu"
    description: "博客主题Stalux - 为内容创作者提供的专业展示平台，支持多种自定义功能，包含评论系统集成、友情链接管理、社交媒体分享和丰富的SEO优化选项，让您的内容更具吸引力和可发现性。"
    # canonical:
    # twitterSite:
    # noindex:
    # nofollow:
    # 分析工具和自定义头部配置
    head:
        # Google Analytics 4 跟踪 ID (格式: G-XXXXXXXXXX)
        # googleAnalyticsId: ""
        # Microsoft Bing Clarity 项目 ID
        # bingClarityId: ""
        # Umami 分析配置
        # umami:
        #   id: ""      # 网站 ID
        #   url: ""     # Umami 脚本 URL
        # 额外自定义头部内容（HTML字符串）
        anyhead: ""
    favicon: "/favicon.svg"
    timezone: "Asia/Shanghai" # IANA 时区，用于生成正确的机器可读时间格式

    author:
        name: "xingwangzhe"
        avatar: "/avatar.png"
        bio: "博客主题Stalux"

    navs:
        - { title: "首页", icon: home, link: "/" }
        - { title: "文章", icon: archive, link: "/archives" }
        - { title: "分类", icon: folder, link: "/categories" }
        - { title: "标签", icon: tag, link: "/tags" }
        - { title: "友链", icon: link, link: "/links" }
        - { title: "关于", icon: user, link: "/about" }
        - { title: "开往", icon: airplay, link: "https://www.travellings.cn/go" }

    typetexts:
        - "Free for free, not free for charge!"
        - "任意键在哪?"
        - "F12看看?"
        - "Hello World!"

    mediaLinks:
        - { icon: github, link: "https://github.com/xingwangzhe/stalux" }
        - { icon: bilibili, link: "https://bilibili.com/" }
        - { icon: X, link: "https://x.com" }
        - { icon: juejin, link: "https://juejin.cn/" }
        - { icon: zhihu, link: "https://www.zhihu.com/" }
        - { icon: maildotru, link: "mailto:xingwangzhe@outlook.com" }
        - { icon: telegram, link: "https://t.me/" }

    links:
        title: "帮助链接"
        description: "这些网站很棒，对本主题有很大帮助!"
        sites:
            - {
                  name: "Astro",
                  description: "构建内容丰富的网站的现代静态网站生成器。",
                  link: "https://astro.build/",
                  icon: "https://astro.build/favicon.svg",
              }
            - {
                  name: "MDN",
                  description: "提供关于Web标准的开放性、详尽且易于理解的信息。",
                  link: "https://developer.mozilla.org/",
                  icon: "https://developer.mozilla.org/favicon.ico",
              }
            - {
                  name: "animtejs",
                  description: "一个强大的JavaScript动画库，帮助你轻松创建复杂的动画效果。",
                  link: "https://animejs.com/",
                  icon: "https://animejs.com/assets/images/favicon.png",
              }
            - {
                  name: "lucide",
                  description: "美观一致的开源图标库，基于 Lucide 图标系统。",
                  link: "https://lucide.dev/",
                  icon: "https://lucide.dev/favicon.ico",
              }
            - {
                  name: "simple-icons",
                  description: "提供数千个品牌图标的开源图标库，适用于网页和应用设计。",
                  link: "https://simpleicons.org/",
                  icon: "https://simpleicons.org/icons/simpleicons.svg",
              }

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
            icp: { enabled: false, number: "辽ICP备XXXXXXXX号" }
            security: { enabled: false, text: "辽公网安备 XXXXXXXXXXXX号", number: "XXXXXXXXXXXX" }
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
            - {
                  label: "Atom",
                  message: "Feed",
                  color: "orange",
                  alt: "Atom Feed",
                  href: "/atom.xml",
              }
            - {
                  label: "LLMs",
                  message: "Dataset",
                  color: "blue",
                  alt: "LLM Dataset",
                  href: "/llms.txt",
              }
        custom: |
            <!-- footer自定义插槽示例，可放统计、挂件等 -->
            <div id="custom-footer-hook"></div>
            <script>console.log('自定义footer已加载');</script>

    comment:
        enabled: false
        waline:
            serverURL: "https://walines.xingwangzhe.fun"
            lang: zh-CN
            emoji: ["https://unpkg.com/@waline/emojis@1.1.0/weibo"]
            reaction: false
            meta: [nick, mail, link]
            wordLimit: 200
            pageSize: 10
```

## 字段说明

- 基础信息: `title`、`url`、`description` 是站点必填；`canonical`/`twitterSite`/`noindex`/`nofollow` 按需开启；`favicon` 支持相对路径。
- 头部扩展: `head` 用于配置分析工具（Google Analytics、Bing Clarity、Umami）和自定义 `<head>` 片段。
    - `head.googleAnalyticsId`: GA4 跟踪 ID
    - `head.bingClarityId`: Microsoft Clarity 项目 ID
    - `head.umami`: Umami 分析配置（包含 `id` 和 `url`）
    - `head.anyhead`: 额外的自定义头部 HTML
- 作者信息: `author.name`、`author.avatar`、`author.bio` 显示在文章和侧边栏等位置。
- 导航与动效: `navs` 为顶部导航，`icon` 使用 Lucide Icons 标准 PascalCase 名称（参见 https://lucide.dev/icons/）；`typetexts` 是首页打字机动效的随机文案。
- 社交与友链: `mediaLinks` 渲染社交图标；`links` 定义友链分组标题、描述和站点列表。
- 页脚: `footer.buildtime` 用于站点运行时长；`copyright` 控制版权显示；`theme` 控制主题信息展示；`beian` 提供 ICP/公安备案开关；`badges` 为页脚徽章列表；`custom` 支持自定义插槽 HTML。
- 评论开关: `comment.enabled` 控制是否在全站渲染评论区（默认 `false`）。
- 评论: `comment.waline` 配置 Waline.

## 常见修改

- 部署到新域名时，更新 `url` 与可选的 `canonical`，并检查导航外链。
- 新增导航项时，仿照 `navs` 结构添加，并从 [Lucide Icons](https://lucide.dev/icons/) 选择 PascalCase 图标名称。
- 需要更多社交或友链时，分别补充到 `mediaLinks` 或 `links.sites`。
- 页脚徽章可按 `{ label, message, color, style?, alt?, href }` 追加；备案信息只在对应开关开启后显示。
- Waline 服务地址或表情包源变更时，同步修改 `comment.waline`，并参考专篇确认客户端是否需要额外参数。

## 校验与预览

- 保存配置后运行 `bun run dev` 预览，控制台会提示缺失字段或格式错误。
- 修改 head 片段或统计脚本后，建议在浏览器控制台确认无报错再部署。---
  title: Stalux 主题配置总览
  tags: - 配置 - 入门
  categories: - 主题配置
  date: "2025-05-10 10:00:00"
  updated: "2025-05-10 16:00:00"
  abbrlink: 0b563d42

---

欢迎使用 Stalux 主题！本文将为您介绍 Stalux 主题的配置系统和基本使用方法。

## 什么是 Stalux

Stalux 是一个基于 Astro 5 构建的现代化博客主题，专为内容创作者设计。它提供了简洁优雅的暗色界面、强大的自定义功能和优异的性能表现。

## 核心特性

- 🚀 **极速性能**: 基于 Astro 5 静态生成，加载速度极快
- 🎨 **暗色主题**: 优雅的暗色设计，提供舒适的阅读体验
- 📝 **Markdown 支持**: 支持 Markdown 和 MDX，支持代码高亮和数学公式
- 💬 **评论系统**: 集成 Waline 评论系统
- 🔍 **全文搜索**: 内置 Pagefind 搜索功能
- 📱 **响应式设计**: 完美适配移动端和桌面端
- 🎯 **SEO 优化**: 自动生成 sitemap、RSS 和 Atom feed

## 配置文件说明

Stalux 主题使用 `config.yml` 文件进行配置，该文件位于项目根目录。

### 配置文件位置

```
你的项目/
├── config.yml          # 主配置文件（你需要编辑这个文件）
├── src/
│   └── content.config.ts  # 配置结构定义（定义了所有可用的配置项）
└── stalux/
    ├── posts/          # 存放文章
    └── about/          # 存放关于页面
```

### 配置结构概览

`config.yml` 文件包含以下主要部分：

```yaml
stalux:
    # 1. 基本信息
    title: 网站标题
    url: 网站地址
    description: 网站描述

    # 2. 作者信息
    author:
        name: 作者名称
        avatar: 头像路径
        bio: 个人简介

    # 3. 导航菜单
    navs:
        - 导航项列表

    # 4. 打字动效文字
    typetexts:
        - 随机显示的文字

    # 5. 社交媒体链接
    mediaLinks:
        - 社交媒体图标和链接

    # 6. 友情链接
    links:
        title: 友链标题
        sites: 友链列表

    # 7. 页脚配置
    footer: 版权、备案、徽章等

    # 8. 评论系统
    comment:
        waline: Waline 配置
```

## 快速开始

### 第一步：基本信息配置

首先配置网站的基本信息：

```yaml
stalux:
    title: 我的博客
    url: https://yourdomain.com
    description: 这是我的个人博客，分享技术和生活
    favicon: /favicon.svg

    author:
        name: 你的名字
        avatar: /avatar.png
        bio: 一句话介绍自己
```

这些是**必填项**，决定了网站的基础信息和 SEO。

### 第二步：配置导航菜单

设置网站顶部的导航菜单：

```yaml
stalux:
    navs:
        - title: 首页
          icon: home
          link: /
        - title: 文章
          icon: archive
          link: /archives
        - title: 关于
          icon: user
          link: /about
```

图标名称来自 [Lucide Icons](https://lucide.dev/icons/)，使用 PascalCase 命名（如 Home、ChevronDown）。

### 第三步：其他可选配置

根据需要配置其他功能，详见各配置专题文档：

- **导航和社交媒体** → 查看《导航和社交媒体配置》
- **友情链接** → 查看《友情链接配置》
- **页脚定制** → 查看《页脚配置详解》
- **评论系统** → 查看《Waline 评论系统配置》

## 配置文件示例

以下是一个最小化的配置示例：

```yaml
stalux:
    title: 我的博客
    url: https://yourdomain.com
    description: 欢迎来到我的博客
    favicon: /favicon.svg

    author:
        name: 张三
        avatar: /avatar.png
        bio: 热爱技术的开发者

    navs:
        - title: 首页
          icon: home
          link: /
        - title: 关于
          icon: user
          link: /about

    typetexts:
        - "Hello World!"
        - "欢迎访问我的博客"

    mediaLinks:
        - icon: github
          link: https://github.com/yourusername

    links:
        title: 友情链接
        description: 我的朋友们
        sites:
            - name: Astro
              description: 静态网站生成器
              link: https://astro.build/
              icon: https://astro.build/favicon.svg

    footer:
        buildtime: "2025-01-01T00:00:00"
        copyright:
            enabled: true
            startYear: 2025
```

## 配置验证

Stalux 使用 TypeScript 和 Zod 进行配置验证：

- ✅ **必填字段检查**: 缺少必填项时会在构建时报错
- ✅ **格式验证**: URL、日期等格式不正确时会提示
- ✅ **类型安全**: TypeScript 提供完整的类型提示

如果配置有误，运行 `bun run dev` 时会看到详细的错误信息。

## 下一步

现在你已经了解了 Stalux 的配置系统，接下来可以：

1. 📖 阅读各配置专题文档，深入了解每个功能
2. ✏️ 开始写作你的第一篇文章（查看《Markdown 文件配置》）
3. 🎨 定制页面样式和布局
4. 🚀 部署你的博客到 Vercel、Netlify 等平台

有任何问题欢迎查阅文档或提交 Issue！
