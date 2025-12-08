# Stalux - Astro 博客主题


**本博客主题已有[软著](./软著证明.pdf)，受中国版权相关法律保护，请务必遵守[LICENSE](./LICENSE)**

<div align="center">

![Stalux 主题图标](src/images/stalux.ico)
</div>

<p align="center">
  一个简洁实用的 Astro 博客主题
</p>

Stalux 是一个基于 Astro 构建的静态博客主题，适用于个人博客搭建。它提供了一些基础功能，如文章展示、分类标签、评论系统等。

## 项目结构

```
stalux/
├── public/                 # 静态资源目录
├── src/
│   ├── components/         # UI 组件
│   ├── components-vue/     # Vue 组件
│   ├── content/            # 内容目录
│   │   ├── posts/          # 博客文章
│   │   └── about/          # 关于页面
│   ├── fonts/              # 字体文件
│   ├── images/             # 图片资源
│   ├── integrations/       # 自定义集成
│   ├── layouts/            # 页面布局组件
│   ├── pages/              # 页面路由
│   ├── scripts/            # 脚本文件
│   ├── styles/             # 全局样式
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── consts.ts           # 默认配置常量
│   ├── content.config.ts   # 内容配置
│   └── types.ts            # 全局类型定义
├── astro.config.mjs        # Astro 配置文件
├── package.json            # 项目依赖和脚本
├── tsconfig.json           # TypeScript 配置
├── _config.yml             # 用户自定义配置文件
├── _stalux.yml             # 主题默认配置文件
└── README.md               # 项目说明文档
```

## 功能特性

- 基于 Astro v5 构建
- 支持 Markdown 和 MDX 格式写作
- 响应式设计，适配移动端
- 只支持暗色模式
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


**_config.yml**是用户自定义配置文件
**_stalux.yml**是主题默认配置文件，不要改动！，但你可以复制到_config.yml中进行修改

```yml
#我的一个配置的示例
#_config.yml

# Stalux 主题用户配置文件
# 这个文件优先级高于 _stalux.yml 默认配置
# 你只需要在这里配置想要修改的选项，其他选项会使用默认值

# 基础站点信息
title: "姓王者的博客"
titleDefault: "姓王者的博客"
siteName: "姓王者的博客"
author: "xingwangzhe"
enableViewTransitions: false  ## 是否启用视图转换效果，默认为 false

# 站点资源配置
favicon: "/favicon.ico"
avatarPath: "/avatar.webp"

# SEO 核心配置
description: "探索、学习、进步、创造无限可能！姓王者的博客致力于分享前端开发技术，包括JavaScript、TypeScript、Vue等web开发知识。作为计算机科学与技术专业的博主，我相信终身学习的价值，这里记录了我的技术成长历程、实用教程和开发心得，希望能为大家提供有价值的参考和启发。可以不会，但不能不学！"
short_description: "探索、学习、进步、创造无限可能！"
url: "https://xingwangzhe.fun"
lang: "zh-CN"
locale: "zh_CN"
keywords: "Stalux, 博客主题, 内容创作, Astro主题, 静态网站生成器, SEO优化, 自定义博客, 响应式设计, 评论系统, 前端开发, Astro,ts,js"
canonical: "https://xingwangzhe.fun"

# <head>元素硬嵌入
head:

# 站点导航配置 图标来自于https://feathericons.com/
nav:
  - title: "首页"
    path: "/"
    icon: "home"
  - title: "归档"
    path: "/archives/"
    icon: "archive"
  - title: "分类"
    path: "/categories/"
    icon: "folder"
  - title: "标签"
    path: "/tags/"
    icon: "tag"
  - title: "友链"
    path: "/links/"
    icon: "link"
  - title: "关于"
    path: "/about/"
    icon: "user"
  - title: "开往"
    path: "https://www.travellings.cn/go.html"
    icon: "airplay"

# 站点特效配置
textyping:
  - "Free as in Freedom"
  - "任意键在哪?"
  - "若为自由故"
  - "Just for fun!"
  - "Hello World!"

# 社交媒体链接配置 ,图标来自于https://simpleicons.org/
medialinks:
  - title: "Github"
    url: "https://github.com/xingwangzhe"
    icon: "github"
  - title: "Bilibili"
    url: "https://space.bilibili.com/1987297874"
    icon: "bilibili"
  - title: "QQ"
    url: "https://qm.qq.com/q/64L8hnwQ2k"
    icon: "qq"
  - title: "eMail"
    url: "mailto:xingwangzhe@outlook.com"
    icon: "maildotru"
  - title: "稀土掘金"
    url: "https://juejin.cn/user/1795939693507712"
    icon: "juejin"

# 评论系统配置 具体看WALINE
comment:
  waline:
    serverURL: "xxx"
    lang: "zh-CN"
    reaction: false
    meta:
      - "nick"
      - "mail"
      - "link"
    wordLimit: 200
    pageSize: 10

# 友情链接配置
friendlinks_title: "友情链接"
friendlinks_description: "优质技术博客交换友情链接，互惠共赢提升网站流量和用户体验。期待与同领域高质量内容创作者建立长期合作关系。"
friendlinks:
  - title: "姓王者的博客"
    url: "https://xingwangzhe.fun"
    avatar: "https://xingwangzhe.fun/avatar.webp"
    description: "探索、学习、进步、创造无限可能！"
  - title: "Lily Ellenvia"
    url: "https://blog.lilynet.work"
    avatar: "https://avatars.githubusercontent.com/u/118451956?v=4"
    description: "喜歡睡覺的普通人"
  - title: "夜梦星尘の折腾日记"
    url: "https://tech.yemengstar.com/"
    avatar: "https://cn-sy1.rains3.com/yemengtechpublic/yemenglogoNEW.bmp"
    description: "眼底星河荡漾，踏着梦走过时光。"
  - title: "浪海导航"
    url: "https://www.langhai.net/"
    avatar: "https://www.langhai.net/assets/images/langhai-logo.png"
    description: "浪海导航 ~ 收录各种类型的博客以及论坛网站"
  - title: "琼西往事"
    url: "https://fushaolei.fun/"
    avatar: "https://cdn.jsdelivr.net/gh/fushaolei/img/20200524104925.jpg"
    description: "Do Not Be Sorry, Be Better"
  - title: "龙腾收录网"
    url: "https://dh.lt6.ltd/"
    avatar: "https://dh.lt6.ltd/favicon.ico"
    description: "我们致力于为广大站长提供一个纯净的精品网站收录,在龙腾收录网可互换友情链接，增加彼此网站曝光度!"
  - title: "ksh"
    url: "https://ksh7.com/"
    avatar: "https://ksh7.com/img/avatar.webp"
    description: "Life Oriented Programming"
  - title: "Admibrill"
    url: "https://blog.qyadbr.top/"
    avatar: "https://source-admibrill.pages.dev/file/f69c9c86b22cb90df18a1.png"
    description: "有志者，事竟成。"
  - title: "大佬论坛"
    url: "https://www.dalao.net/"
    avatar: "https://www.dalao.net/upload/attach/202410/1_1728884298539.webp"
    description: "站长论坛，互联网站长综合交流，十年之约合作论坛"
  - title: "BlogFinder"
    url: "https://bf.zzxworld.com/"
    avatar: "https://bf.zzxworld.com/images/favicon.png"
    description: "每个博客都是一座宝藏"
  - title: "浩瀚星河"
    url: "https://www.golangblog.com"
    avatar: "https://cdn.codepzj.cn/image/20250529174726187.jpeg"
    description: "缓慢向上也是一种勇气。"
  - title: "清羽飞扬"
    url: "https://blog.liushen.fun/"
    avatar: "https://blog.liushen.fun/info/avatar.ico"
    description: "柳影曳曳，清酒孤灯，扬笔撒墨，心境如霜"
  - title: "时歌的博客"
    url: "https://www.lapis.cafe/"
    avatar: "https://www.lapis.cafe/_astro/avatar.exAKhE7w_1xwha6.webp"
    description: "理解以真实为本，但真实本身并不会自动呈现"
  - title: "懋和道人"
    url: "https://www.dao.js.cn/"
    avatar: "https://www.dao.js.cn/zb_users/upload/2021/10/202110151634246697912592.png"
    description: "李懋和，俗名李栋梁。书法、国画爱好者，互联网安全与前端建设者。"
  - title: "拾柒"
    url: "https://www.s17.cn"
    avatar: "https://www.s17.cn/logo.png"
    description: "奇奇怪怪。"
  - title: "洛屿的小站"
    url: "https://www.drluo.top/"
    avatar: "https://www.drluo.top/img/avatar.webp"
    description: "嗨，靓仔，今天也要有个好心情哦！"
  - title: "云端的解构者"
    url: "https://www.zheep.top"
    avatar: "https://www.zheep.top/img/uuz.jpg"
    description: "以我观物，故物皆著我之色彩"
  - title: "划水 - 划划水，提升自己"
    url: "https://www.hsuii.com/"
    avatar: "https://www.hsuii.com/images/1747640853300.png"
    description: "划水导航是一个轻量级免费且强大的个人成长网站，在短视频快节奏的时代，不妨划划水提升自己。"
  - title: "Pinpe 的云端"
    url: "https://blog.pinpe.top/"
    avatar: "https://pinpe.top/head.jpg"
    description: "一个属于自己的云朵。"
  - title: "我的飛鳥集"
    url: "https://fmcf.cc/"
    avatar: "https://api.fmcf.cc/api/v2/objects/avatar/fvfzp7f411o9qkrba6.jpg"
    description: "代码与诗的世界"
  - title: "J將軍的博客 - BG9JMR的无线电小站~ "
    url: "https://blog.bg9jmr.icu/"
    avatar: "https://blog.bg9jmr.icu/upload/b_dcfe8673d4b07f0d2e6f138fbea38d33.jpg"
    description: "欢迎来到J將軍的个人小站！呼号：BG9JMR 请在bilibili或者X上关注我~。"

# 页脚配置
footer:
  buildtime: "2024-06-20T10:00:00"

  # 版权信息
  copyright:
    enabled: true
    startYear: 2024
    customText: ""

  # 主题信息
  theme:
    showPoweredBy: true
    showThemeInfo: true

  # 备案信息
  beian:
    # ICP备案
    icp:
      enabled: true
      number: " 辽ICP备2024042064号-1"
    # 公安备案
    security:
      enabled: false
      text: "辽公网安备 XXXXXXXXXXXX号"
      number: "XXXXXXXXXXXX"

  # 徽章配置
  badges:
    - label: "Built with"
      message: "❤"
      color: "red"
      style: "for-the-badge"
      alt: "Built with Love"
      href: "https://github.com/xingwangzhe"
    - label: "Powered by"
      message: "Astro"
      color: "orange"
      style: "flat-square"
      alt: "Powered by Astro"
      href: "https://astro.build/"
    - label: "Theme"
      message: "Stalux"
      color: "blueviolet"
      alt: "Theme: Stalux"
      href: "https://stalux.needhelp.icu/"
    - label: "license"
      message: "MIT"
      color: "blue"
      alt: "License: MIT"
      href: "https://github.com/xingwangzhe/stalux"
    - label: "阿里云"
      message: "服务器"
      alt: "阿里云支持"
      href: "https://www.aliyun.com/minisite/goods?userCode=lmvvqvl9"
    - label: "travellings"
      message: "开往🚆"
      color: "green"
      alt: "开往-友链接力"
      href: "https://www.travellings.cn/go.html"
    - label: "dalao"
      message: "大佬论坛"
      color: "yellowgreen"
      alt: "大佬论坛"
      href: "https://www.dalao.net/"
    - label: "BlogFinder"
      message: "探索博客"
      color: "yellow"
      alt: "BlogFinder"
      href: "https://bf.zzxworld.com/"
    - label: "BlogsClub"
      message: "空间穿梭"
      color: "teal"
      alt: "空间穿梭-随机访问BlogsClub成员博客"
      href: "https://www.blogsclub.org/go"
    - label: "EdgeOne"
      message: "CDN"
      color: "blue"
      alt: "腾讯EdgeOne CDN"
      href: "https://edgeone.ai/zh"
    - label: "foreverblog"
      message: "十年之约"
      color: "blue"
      alt: "十年之约"
      href: "https://www.foreverblog.cn/blog/6304.html"
    - label: "BLOGS·CN"
      message: "笔墨迹"
      color: "#eb5055"
      alt: "本站已加入BLOGS·CN"
      href: "https://blogscn.fun/"
    - label: "blogverse"
      message: "博客宇宙"
      color: "#4285f4"
      alt: "博客宇宙 - 精选博客导航"
      href: "https://blogverse.cn"
    - label: "🥱"
      message: "无聊湾"
      color: "#d0273e"
      alt: "无聊湾 🥱 "
      href: "https://boringbay.com"
    - label: "Sitemap"
      message: "XML"
      color: "orange"
      alt: "Sitemap XML"
      href: "/sitemap-index.xml"
    - label: "RSS"
      message: "Feed"
      color: "orange"
      alt: "RSS Feed"
      href: "/rss.xml"
    - label: "Atom"
      message: "Feed"
      color: "orange"
      alt: "Atom Feed"
      href: "/atom.xml"
    - label: "LLMs"
      message: "Dataset"
      color: "blue"
      alt: "LLM Dataset"
      href: "/llms.txt"



```


## 写作

在 `src/content/posts/` 目录下创建 Markdown 文件：

```
---
title: 我的第一篇文章
description: 文章描述
tags:
  - 标签1
  - 标签2
categories:
  - 分类
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

1. 修改 [astro.config.mjs](stalux/astro.config.mjs) 中的 `site` 配置为你的 GitHub Pages URL
2. 配置 GitHub Actions 进行自动部署

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

如果您在使用过程中遇到问题或有建议，请访问 [GitHub 仓库](https://github.com/xingwangzhe/stalux) 提交 Issue 或 Pull Request。
