---
title: 总配置概览
tags:
    - 配置
categories:
    - 主题配置
---
```ts
console.log('欢迎使用Stalux主题博客')
```
## 总配置使用

### 文章放在哪?

当然是放在`src>content>posts`下
关于页面放在`src>content>about`下
默认已经有了这些文件,你可以看这些文件的frontmatter配置格式,当然,更多**内容合集**的frontmatter配置可以在`src>content.config.ts`下找到,在此不做赘述

## 默认配置与自定义配置

下面的是默认配置,这是当前站点在没有自定义配置或者自定义配置某些选项为空或找不到时采取默认配置
`src>consts.ts`
> 这个默认配置不要修改,只是作为对照,方便维护查看使用,

你可以在下面的路径下创建`_config.ts`文件来实现自定义配置,当然同级目录下已经存在了`_config.ts.template`文件,方便修改
`src>_config.ts`

### 站点基本信息

- **`author`** (`string`): 内容创作者信息。例如：`'xingwangzhe'`。
- **`locale`** (`string`): 内容的区域设置。例如：`'zh_CN'`。
- **`siteName`** (`string`): 站点名称，用于品牌构建。例如：`'Stalux'`。

### 示例 (站点基本信息)

```ts
// 基础站点信息
author: 'xingwangzhe',
locale: 'zh_CN',
siteName: 'Stalux',
```

### `<head>` 元素硬嵌入

- **`head`** (`string`): 允许直接在 `<head>` 标签中添加自定义的 HTML 内容，如 `meta` 标签、`script` 脚本、`style` 样式等。

### 示例 (`<head>` 元素硬嵌入)

```ts
head: `<meta name="nishia" content="nihaiso">
      <script>console.log("欢迎使用Stalux主题")</script>`,
```

### 站点资源配置

- **`favicon`** (`string`): 网站图标路径，同时也用作 iOS 设备添加到主屏幕的图标。例如：`'/stalux.ico'`。
- **`avatarPath`** (`string`, 可选): 用户头像路径。如果配置了此项，主题可能会在特定位置显示用户头像。 (在 `consts.ts` 中被注释掉了，如果需要使用，请取消注释并提供正确路径)

### 示例 (站点资源配置)

```ts
// 站点资源配置
favicon: '/stalux.ico',
// avatarPath: 'src/images/avatar.webp', // 如需使用请取消注释并配置正确路径
```

### 社交媒体优化配置

这部分配置主要用于优化在社交平台分享时内容的显示效果。包含 Open Graph (og) 和 Twitter 的相关配置。

- **`ogImage`** (`string`): Open Graph 分享图片的 URL (简单配置)。
- **`openGraph`** (`object`): Open Graph 的完整配置对象。
    - **`basic`** (`object`): 基础信息。
        - `title` (`string`): 分享标题。
        - `type` (`string`): 内容类型，例如 `'website'`。
        - `image` (`string`): 分享图片 URL。
        - `url` (`string`): 分享内容的 URL。
    - **`optional`** (`object`): 可选信息。
        - `description` (`string`): 分享描述。
        - `locale` (`string`): 内容区域设置。
        - `siteName` (`string`): 站点名称。
    - **`image`** (`object`): 图片附加信息。
        - `alt` (`string`): 图片的替代文本。
- **`twitterImage`** (`string`): Twitter 分享图片的 URL (简单配置)。
- **`twitterCreator`** (`string`): Twitter 创作者的用户名 (例如 `@yourTwitterHandle`)。
- **`twitter`** (`object`): Twitter 卡片的完整配置对象。
    - `card` (`string`): 卡片类型，例如 `'summary_large_image'`。
    - `site` (`string`): 网站的 Twitter 用户名。
    - `creator` (`string`): 内容创作者的 Twitter 用户名。
    - `title` (`string`): 分享标题。
    - `description` (`string`): 分享描述。
    - `image` (`string`): 分享图片 URL。
    - `imageAlt` (`string`): 图片的替代文本。

### 示例 (社交媒体优化配置)

```ts
// 社交媒体优化配置
ogImage: 'https://www.baidu.com/og-image.jpg',
openGraph: {
  basic: {
    title: 'Stalux - 专业博客主题',
    type: 'website',
    image: 'https://www.baidu.com/og-image.jpg',
    url: 'https://stalux.needhelp.icu',
  },
  optional: {
    description: '博客主题Stalux - 为内容创作者提供专业的展示平台',
    locale: 'zh_CN',
    siteName: 'Stalux'
  },
  image: {
    alt: 'Stalux主题预览图'
  }
},
twitterImage: 'https://www.baidu.com/twitter-image.jpg',
twitterCreator: '@yourTwitterHandle',
twitter: {
  card: 'summary_large_image',
  site: 'Stalux',
  creator: '@yourTwitterHandle',
  title: 'Stalux - 专业博客主题',
  description: '博客主题Stalux - 为内容创作者提供专业的展示平台',
  image: 'https://www.baidu.com/twitter-image.jpg',
  imageAlt: 'Stalux主题预览图'
},
```

### 额外HTML标签扩展

- **`extend`** (`object`): 用于在 `<head>` 中添加额外的 `meta` 和 `link` 标签。
    - **`meta`** (`Array<object>`): `meta` 标签数组，每个对象包含 `name` 和 `content` 属性。
    - **`link`** (`Array<object>`): `link` 标签数组，每个对象包含 `rel`, `sizes` (可选), `href`, `color` (可选) 等属性。

### 示例 (额外HTML标签扩展)

```ts
extend: {
  meta: [
    { name: 'application-name', content: 'Stalux' },
    { name: 'apple-mobile-web-app-title', content: 'Stalux' },
    { name: 'theme-color', content: '#3367D6' }
  ],
  link: [
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#5bbad5' }
  ]
},
```

### 站点导航配置

- **`nav`** (`Array<object>`): 定义站点的导航链接。每个对象包含：
    - `title` (`string`): 导航链接的显示文本。
    - `path` (`string`): 导航链接的路径。
    - `icon` (`string`): 导航链接的图标 (通常对应主题内置的图标名称)。

### 示例 (站点导航配置)

```ts
nav: [
  { title: '首页', path: '/', icon: 'home' },
  { title: '归档', path: '/archives', icon: 'archive' },
  { title: '分类', path: '/categories', icon: 'folder' },
  { title: '标签', path: '/tags', icon: 'tag' },
  { title: '友链', path: '/links', icon: 'link' },
  { title: '关于', path: '/about', icon: 'user' },
],
```

### 站点特效配置

- **`textyping`** (`Array<string>`): 用于配置首页打字机效果的文本数组。

### 示例 (站点特效配置)

```ts
textyping: [
  'Free for free, not free for charge!',
  '任意键在哪?',
  'F12看看?',
  'Hello World!',
],
```

### 评论系统配置

- **`comment`** (`object`): 评论系统相关配置。目前仅支持 Waline。
    - **`waline`** (`object`): Waline 配置对象。
        - `serverURL` (`string`): Waline 服务端地址。
        - `lang` (`string`): Waline 组件语言。
        - `emoji` (`Array<string>`): 自定义表情包 CDN 地址。
        - `requiredFields` (`Array<string>`): 评论必填字段。
        - `reaction` (`boolean`): 是否启用文章反应功能。
        - `meta` (`Array<string>`): 评论者信息显示项，如 `'nick'`, `'mail'`, `'link'`。
        - `wordLimit` (`number`): 评论字数限制。
        - `pageSize` (`number`): 每页显示的评论数量。

### 示例 (评论系统配置)

```ts
comment: {
  waline: {
    serverURL: 'https://waline.xingwangzhe.fun',
    lang: 'zh-CN',
    emoji: ['https://unpkg.com/@waline/emojis@1.1.0/weibo'],
    requiredFields: [],
    reaction: true,
    meta: ['nick', 'mail', 'link'],
    wordLimit: 200,
    pageSize: 10
  }
},
```

### 社交媒体链接配置

- **`medialinks`** (`Array<object>`): 配置显示在网站特定位置的社交媒体图标链接。每个对象包含：
    - `title` (`string`): 链接标题 (鼠标悬停时显示)。
    - `url` (`string`): 社交媒体主页 URL。
    - `icon` (`string`): 图标名称 (通常对应主题内置的图标)。

### 示例 (社交媒体链接配置)

```ts
medialinks: [
  { title: 'Github', url: 'https://github.com/', icon: 'github' },
  { title: 'Bilibili', url: 'https://space.bilibili.com/', icon: 'bilibili' },
  // ...更多社交链接
],
```

### 友情链接配置

- **`friendlinks_title`** (`string`): 友情链接区域的标题。
- **`friendlinks_description`** (`string`): 友情链接区域的描述文本。
- **`friendlinks`** (`Array<object>`): 友情链接列表。每个对象包含：
    - `title` (`string`): 友链网站名称。
    - `url` (`string`): 友链网站 URL。
    - `avatar` (`string`): 友链网站头像/图标 URL。
    - `description` (`string`): 友链网站描述。

### 示例 (友情链接配置)

```ts
friendlinks_title: '友情链接',
friendlinks_description: '优质技术博客交换友情链接...',
friendlinks: [
  {
    title: 'Astro',
    url: 'https://astro.build/',
    avatar: 'https://astro.build/favicon.svg',
    description: 'The web framework for content-driven websites'
  },
  // ...更多友链
],
```

### SEO 配置

SEO (搜索引擎优化) 相关的配置对于提升网站在搜索引擎中的可见性至关重要。

#### SEO 核心配置

- **`description`** (`string`): 网站的全局描述。搜索引擎会使用它来了解您网站的内容。建议长度为 150-160 个字符。
  - 示例: `'博客主题Stalux - 为内容创作者提供的专业展示平台...'`
- **`url`** (`string`): 您网站的完整规范 URL (包括 `https://` 或 `http://`)。
  - 示例: `'https://stalux.needhelp.icu'`
- **`keywords`** (`string`): 与您网站内容相关的关键词列表，以逗号分隔。虽然现代搜索引擎对关键词元标记的依赖性降低，但提供相关关键词仍然是一种良好实践。
  - 示例: `'Stalux, 博客主题, 内容创作, Astro主题, ...'`
- **`lang`** (`string`): 网站内容的主要语言。这有助于搜索引擎将您的内容展示给使用该语言的用户。
  - 示例: `'zh-CN'`

#### SEO 重要辅助配置

- **`titleDefault`** (`string`): 网站的默认标题。当特定页面没有提供自己的标题时，将使用此标题。
  - 示例: `'Stalux博客'`
- **`canonical`** (`string`): 网站的规范 URL。有助于防止因 URL 参数或变体导致的重复内容问题。
  - 示例: `'https://stalux.needhelp.icu'`

#### 示例 (SEO 核心与辅助配置)

```ts
// SEO 核心配置
description: '博客主题Stalux - 为内容创作者提供的专业展示平台，支持多种自定义功能，包含评论系统集成、友情链接管理、社交媒体分享和丰富的SEO优化选项，让您的内容更具吸引力和可发现性。',
url: 'https://stalux.needhelp.icu',
keywords: 'Stalux, 博客主题, 内容创作, Astro主题, 静态网站生成器, SEO优化, 自定义博客, 响应式设计, 评论系统, 前端开发, Astro',
lang: 'zh-CN',

// SEO 重要辅助配置
titleDefault: 'Stalux博客',
canonical: 'https://stalux.needhelp.icu',
```

#### 高级 SEO 配置 (结构化数据)

结构化数据（Structured Data）是一种标准化的格式，用于向搜索引擎提供关于页面的明确信息，并对页面内容进行分类。这可以帮助搜索引擎更好地理解您的内容，并可能在搜索结果中以“富摘要”（Rich Snippets）的形式展示。

- **`structuredData`** (`object`): 一个符合 [Schema.org](https://schema.org) 规范的对象。
    - **`@context`** (`string`): 通常设置为 `'https://schema.org'`。
    - **`@type`** (`string`): 描述项目的主要类型，例如对于整个网站，通常是 `'WebSite'`。
    - **`name`** (`string`): 网站的名称。
    - **`url`** (`string`): 网站的 URL。
    - **`description`** (`string`): 网站的描述。
    - **`author`** (`object`): 描述网站主要作者或所有者的对象。
        - **`@type`** (`string`): 作者的类型，通常是 `'Person'` 或 `'Organization'`。
        - **`name`** (`string`): 作者或组织的名称。

#### 示例 (结构化数据)

```ts
structuredData: {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Stalux",
  "url": "https://stalux.needhelp.icu",
  "description": "博客主题Stalux - 为内容创作者提供专业的展示平台",
  "author": {
    "@type": "Person",
    "name": "xingwangzhe",
  }
},
```

### 页脚配置

页脚 (`footer`) 部分的配置允许您自定义网站底部的版权信息、主题信息、备案号以及徽章等内容。

- **`buildtime`** (`string | number`): 站点构建时间。用于计算网站已运行时间等。支持多种日期时间格式或时间戳。
  - 推荐使用 ISO 8601 格式: `'2024-06-20T10:00:00'`
  - 也支持: `'2024-06-20 10:00:00'`, `'2024-06-20'`, `1687230000000` (毫秒时间戳)
- **`copyright`** (`object`): 版权信息配置。
    - **`enabled`** (`boolean`): 是否启用版权信息显示。默认为 `true`。
    - **`startYear`** (`number`, 可选): 版权的起始年份。如果设置，版权年份将显示为 `startYear - 当前年份`。
    - **`customText`** (`string`, 可选): 自定义版权文本。如果为空，将使用默认格式。
- **`theme`** (`object`): 主题信息显示配置。
    - **`showPoweredBy`** (`boolean`): 是否显示 "Powered by Astro"。默认为 `true`。
    - **`showThemeInfo`** (`boolean`): 是否显示 "Theme is Stalux"。默认为 `true`。
- **`beian`** (`object`): 网站备案信息配置 (主要针对中国大陆用户)。
    - **`icp`** (`object`): ICP 备案信息。
        - **`enabled`** (`boolean`): 是否显示 ICP 备案号。默认为 `false`。
        - **`number`** (`string`): ICP 备案号。
    - **`security`** (`object`): 公安联网备案信息。
        - **`enabled`** (`boolean`): 是否显示公安备案信息。默认为 `false`。
        - **`text`** (`string`): 公安备案显示的完整文本。
        - **`number`** (`string`): 公安备案号中的数字部分，用于生成跳转链接。
- **`badges`** (`Array<BadgeOptions>`): 在页脚显示的徽章列表。每个徽章是一个对象，可以包含以下属性 (具体可参考 `src/types.ts` 中的 `BadgeOptions` 类型定义)：
    - `label` (`string`): 徽章的标签文本 (左侧部分)。
    - `message` (`string`): 徽章的消息文本 (右侧部分)。
    - `color` (`string`): 徽章的颜色 (例如 `red`, `green`, `blueviolet` 或十六进制颜色代码)。
    - `style` (`string`, 可选): 徽章样式 (例如 `flat-square`, `for-the-badge`)。
    - `alt` (`string`, 可选): 图片的 alt 文本，用于可访问性。
    - `href` (`string`, 可选): 点击徽章时跳转的链接。

#### 示例 (页脚配置)

```ts
footer: {
  buildtime: '2024-06-20T10:00:00',
  copyright: {
    enabled: true,
    startYear: 2024,
    customText: ''
  },
  theme: {
    showPoweredBy: true,
    showThemeInfo: true
  },
  beian: {
    icp: {
      enabled: false,
      number: '辽ICP备XXXXXXXX号'
    },
    security: {
      enabled: false,
      text: '辽公网安备 XXXXXXXXXXXX号',
      number: 'XXXXXXXXXXXX'
    }
  },
  badges: [
    {
      label: 'Built with',
      message: '❤',
      color: 'red',
      style: 'for-the-badge',
      alt: 'Built with Love',
      href: 'https://github.com/xingwangzhe'
    },
    {
      label: 'Powered by',
      message: 'Astro',
      color: 'orange',
      style: 'flat-square',
      alt: 'Powered by Astro',
      href: 'https://astro.build/'
    },
    {
      label: 'Theme',
      message: 'Stalux',
      color: 'blueviolet',
      alt: 'Theme: Stalux',
      href: 'https://stalux.needhelp.icu/'
    },
    // ... 更多徽章配置
  ]
}
```

---

接下来，我们将分别创建独立的 Markdown 文件来详细介绍 SEO 配置、页脚配置等。