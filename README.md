# 🌟 Stalux - 高效、美观、灵活的 Astro 博客主题

<p align="center">
  <img src="https://raw.githubusercontent.com/xingwangzhe/stalux/main/public/stalux.ico" width="100" alt="Stalux 主题图标">
</p>

<p align="center">
  <strong>简单，但不简陋；美观，但不浮华。</strong>
</p>

Stalux 是一款基于 Astro 框架开发的静态博客主题，专为内容创作者设计，追求高性能、美观直观的用户界面与灵活的配置系统。主题名称"Stalux"中的"Sta"代表静态（Static），"lux"代表奢华（Luxury）的外观体验。

## 📦 主题结构

Stalux 主题采用清晰的项目结构，便于管理和定制:

```text
├── public/              # 静态资源 (图片、字体等)
├── src/
│   ├── _config.ts       # 自定义配置文件
│   ├── components/      # UI组件
│   ├── content/         # 内容集合 (博客文章、关于页面)
│   │   ├── posts/       # 博客文章
│   │   └── about/       # 关于页面
│   ├── consts.ts        # 默认配置常量只作为参考，不建议改
|   |-- _config.ts       # 自定义配置，这是需要改的
│   ├── layouts/         # 页面布局组件
│   ├── pages/           # 页面定义
│   ├── styles/          # 全局样式
│   ├── types.ts         # TypeScript类型定义
│   └── utils/           # 工具函数
├── astro.config.mjs     # Astro 配置
└── tsconfig.json        # TypeScript 配置
```

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


## 🚀 开始使用

### 安装主题

首先，您需要安装 Stalux 主题。有两种方式可供选择：


# 或者手动克隆仓库
```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog-name
cd my-blog-name
npm install
```

这种方式会从 GitHub 仓库克隆完整项目，包括所有示例文章和配置。

#### 方式二：手动集成到现有项目 不推荐（

如果您已有 Astro 项目，希望集成 Stalux 主题：

1. 克隆仓库到本地
   ```bash
   git clone https://github.com/xingwangzhe/stalux.git
   ```

2. 复制以下目录到您的 Astro 项目中：
   - `src/components` - UI组件
   - `src/layouts` - 页面布局
   - `src/styles` - 主题样式
   - `src/scripts` - 脚本文件
   - `public/images` - 图片资源

3. 复制并修改配置文件：
   ```bash
   cp stalux/src/_config.ts.template your-project/src/_config.ts
   cp stalux/src/consts.ts your-project/src/
   cp stalux/src/types.ts your-project/src/
   ```

4. 根据您的需要调整 `astro.config.mjs` 文件

### 安装依赖

安装主题后，进入项目目录并安装依赖：

```bash
# 进入项目目录
cd your-project-name

# 使用 npm 安装依赖
npm install

# 或使用其他包管理器
# yarn install
# pnpm install
# bun install
```

### 开发服务器

启动开发服务器，实时预览您的更改：

```bash
npm run dev
```

启动后访问 `http://localhost:4321` 查看您的站点。

### 构建项目

当您完成开发并准备部署时，构建项目：

```bash
npm run build
```

生成的静态文件将位于 `./dist/` 目录。

### 预览构建结果

您可以在部署前本地预览构建结果：

```bash
npm run preview
```

## 📝 内容创作

Stalux 支持通过 Markdown 和 MDX 创建内容，让您专注于写作而不必担心样式和布局。

### 内容目录结构

所有内容文件都放置在 `src/content/` 目录下:

- **博客文章**: 存放在 `src/content/posts/` 目录中
- **关于页面**: 存放在 `src/content/about/` 目录中

### 创建新文章

创建一个新的博客文章，只需在 `src/content/posts/` 目录下创建一个 `.md` 或 `.mdx` 文件：

```bash
# 示例
touch src/content/posts/my-first-post.md
```

### Frontmatter 配置

每个 Markdown 文件顶部的 frontmatter 配置是必需的，它定义了文章的元数据：

并非所有元数据都被使用，有些暂作保留，以供后续使用

```markdown
---
title: 我的第一篇文章      # 文章标题（必需）
description: 这是文章简短描述  # 文章描述（SEO友好）
pubDate: 2025-5-10T10:00:00+08:00  # 发布日期（必需）
updatedDate: 2025-5-13    # 更新日期（可选）
cover: /images/cover.jpg  # 封面图片（可选）
coverAlt: 封面图片说明    # 封面图片Alt文本（可选）
tags:                     # 文章标签（可选）
    - 标签1
    - 标签2
categories:               # 文章分类（可选）
    - 主分类
    - 子分类
featured: true            # 是否为特色文章（可选）
draft: false              # 是否为草稿（可选）
---

文章内容...
```

### 支持的 Markdown 功能

Stalux 主题扩展了标准 Markdown 语法，支持丰富的内容呈现：

#### 代码块高亮

````markdown
```javascript
// 带有语法高亮的代码块
function greet() {
  console.log('Hello, Stalux!');
}
```
````

#### 数学公式

使用 KaTeX 渲染数学公式：

```markdown
行内公式: $E = mc^2$

块级公式:
$$
\frac{d}{dx}(x^n) = nx^{n-1}
$$
```

#### 警告框 这个需要插件 astro-tips

```markdown
:::note
这是一个普通提示框
:::

:::info
这是一个信息提示框
:::

:::warning
这是一个警告提示框
:::

:::danger
这是一个危险提示框
:::
```

#### 图片增强

```markdown
![图片说明|自定义宽度=400px](/path/to/image.jpg)
```

#### 表格支持

```markdown
| 姓名 | 年龄 | 职业 |
|------|------|------|
| 张三 | 25   | 工程师 |
| 李四 | 30   | 设计师 |
```

更多 Markdown 功能和用法示例可以在 `src/content/posts/_markdown.md` 文件中找到。

## ⚙️ 主题配置

Stalux 提供了灵活的配置系统，所有配置都集中在 `src/_config.ts` 文件中：

### 基础配置

1. 首先将 `_config.ts.template` 复制并重命名为 `_config.ts`（如果使用模板安装，这一步已自动完成）
2. 将 `useConfig` 设置为 `true` 以启用自定义配置
3. 根据需要修改 `siteConfig` 对象中的各项配置

```typescript
// src/_config.ts
export const useConfig: boolean = true;

export const siteConfig: SiteConfig = {
  // 基础站点信息
  title: '',                        // 页面标题（可为空）
  titleDefault: '姓王者的博客',       // 默认标题
  siteName: '姓王者的博客',          // 站点名称
  author: 'xingwangzhe',            // 作者名称
  description: '探索、学习、进步、创造无限可能！', // 站点描述
  url: 'https://xingwangzhe.fun',   // 站点URL
  
  // 其他配置...
}
```

### 配置项详解

#### 基础信息配置

```typescript
// 基础站点信息
title: '',                        // 页面标题（空则使用titleDefault）
titleDefault: '姓王者的博客',       // 默认标题
siteName: '姓王者的博客',          // 站点名称
author: 'xingwangzhe',            // 作者信息

// SEO配置
description: '探索、学习、进步、创造无限可能！...', // 网站描述
short_description: "探索、学习、进步、创造无限可能！",
url: 'https://xingwangzhe.fun',   // 完整网站URL
lang: 'zh-CN',                    // 语言设置
locale: 'zh_CN',                  // 区域设置
keywords: 'Stalux, 博客主题, 内容创作, Astro主题...', // 关键词
canonical: 'https://xingwangzhe.fun', // 规范链接

// 资源配置
favicon: '/favicon.ico',          // 网站图标
avatarPath: 'src/images/avatar.webp', // 头像路径
```

#### 导航配置

```typescript
nav: [
  { title: '首页', path: '/', icon: 'home' },
  { title: '归档', path: '/archives', icon: 'archive' },
  { title: '分类', path: '/categories', icon: 'folder' },
  { title: '标签', path: '/tags', icon: 'tag' },
  { title: '友链', path: '/links', icon: 'link' },
  { title: '关于', path: '/about', icon: 'user' },
]
```

#### 特效配置

```typescript
textyping: [
  'Free for free, not free for charge!',
  '任意键在哪?',
  'F12看看?',
  'Hello World!',
]
```

#### 社交媒体配置

```typescript
medialinks: [
  { title: 'Github', url: 'https://github.com/xingwangzhe', icon: 'github' },
  { title: 'Bilibili', url: 'https://space.bilibili.com/1987297874', icon: 'bilibili' },
  { title: 'QQ', url: 'https://wpa.qq.com/msgrd?v=3&uin=2098422920&site=qq&menu=yes', icon: 'qq' },
  { title: 'eMail', url: 'mailto:xingwangzhe@outlook.com', icon: 'maildotru' }
]
```

#### Waline 评论系统配置

```typescript
comment: {
  waline: {
    serverURL: 'https://waline.xingwangzhe.fun', // Waline服务器地址
    lang: 'zh-CN',                               // 语言设置
    emoji: ['https://unpkg.com/@waline/emojis@1.1.0/weibo'], // 表情包
    requiredFields: [],                          // 必填项
    reaction: true,                              // 文章反应
    meta: ['nick', 'mail', 'link'],             // 评论者元数据
    wordLimit: 200,                             // 字数限制
    pageSize: 10                                // 评论分页大小
  }
}
```

#### 友情链接配置

```typescript
friendlinks_title: '友情链接',
friendlinks_description: '优质技术博客交换友情链接，互惠共赢提升网站流量和用户体验。',
friendlinks: [
  {
    title: 'Astro',
    url: 'https://astro.build/',
    avatar: 'https://astro.build/favicon.svg',
    description: 'The web framework for content-driven websites'
  },
  // 更多友情链接...
]
```

#### 页脚配置

```typescript
footer: {
  // 站点构建时间
  buildtime: '2024-06-20T10:00:00+8:00',
  
  // 版权信息
  copyright: {
    enabled: true,           // 是否启用版权信息
    startYear: 2024,         // 起始年份
    customText: ''           // 自定义版权文本
  },
  
  // 主题信息
  theme: {
    showPoweredBy: true,     // 是否显示"Powered by Astro"
    showThemeInfo: true      // 是否显示"Theme is Stalux"
  },
  
  // 备案信息
  beian: {
    icp: {
      enabled: true,
      number: ' 辽ICP备2024042064号-1'
    },
    security: {
      enabled: false,
      text: '辽公网安备 XXXXXXXXXXXX号',
      number: 'XXXXXXXXXXXX'
    }
  },
  
  // 徽章配置
  badges: [
    {
      label: 'Built with',
      message: '❤',
      color: 'red',
      style: 'for-the-badge',
      alt: 'Built with Love',
      href: 'https://github.com/xingwangzhe'
    },
    // 更多徽章配置...
  ]
}
```

### 自定义头部元素

```typescript
head: `
  <script>console.log('我是姓王者')</script>
`
```

完整的配置选项和说明可以在项目的示例文章中找到：
- `src/content/posts/_config_basic.md`
- `src/content/posts/_config_header_and_head.md` 
- `src/content/posts/_config_footer.md`
- 等其他配置相关示例文章

## 🌐 部署

Stalux 主题生成的是纯静态网站，可以轻松部署到任何支持静态网站的托管服务。以下是几种常见的部署方式：

### Vercel 部署（推荐）

Vercel 提供了最简便的部署方式，并支持自动化部署：

1. 在 [Vercel](https://vercel.com/) 创建账号
2. 导入您的 GitHub 仓库
3. 配置构建选项：
   - Framework Preset: Astro
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 点击 Deploy

### Netlify 部署

1. 在 [Netlify](https://www.netlify.com/) 创建账号
2. 点击"New site from Git"
3. 选择您的代码托管平台并授权
4. 选择您的仓库
5. 配置构建选项：
   - Build Command: `npm run build`
   - Publish Directory: `dist`
6. 点击 Deploy site

### GitHub Pages 部署

1. 在 `astro.config.mjs` 中配置基础路径：

```javascript
export default defineConfig({
  site: 'https://username.github.io',
  base: '/repo-name', // 如果是用户或组织站点则删除此行
  // ...其他配置
});
```

2. 创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
        
      - name: Build website
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
```

3. 在仓库设置中配置 GitHub Pages 来源为 `gh-pages` 分支

### 自定义域名配置

如果您有自己的域名，可以在部署平台上配置：

1. 在您的域名 DNS 设置中添加 CNAME 记录，指向托管平台提供的域名
2. 在托管平台的设置中添加您的自定义域名
3. 对于 GitHub Pages，还需在 `public` 目录中添加一个包含您域名的 `CNAME` 文件

更多详细的部署指南，请参考 `DEPLOY.md` 文件。

## 🧞 常用命令

所有命令在项目根目录下运行:

| 命令                     | 功能                                             |
| :----------------------- | :----------------------------------------------- |
| `npm install`           | 安装依赖                                         |
| `npm run dev`           | 启动本地开发服务器，地址为 `localhost:4321`      |
| `npm run build`         | 构建生产站点到 `./dist/` 目录                    |
| `npm run preview`       | 在部署前本地预览构建结果                         |
| `npm run astro ...`     | 运行CLI命令，如 `astro add`, `astro check`       |

### 问题排查命令

如果在使用过程中遇到问题，以下命令可能对排查有帮助：

| 命令                     | 功能                                             |
| :----------------------- | :----------------------------------------------- |
| `npm cache clean --force` | 清除NPM缓存                                     |
| `npm update`             | 更新依赖到最新版本                               |
| `npm ls astro`           | 检查Astro安装情况                                |
| `node -v`                | 检查Node.js版本（推荐v18+）                      |

## 🙏 致谢

Stalux 主题基于 Astro 框架开发，同时受到多个优秀开源项目的启发。特别感谢:

- [Astro](https://astro.build/) - 提供了强大的静态站点生成框架
- [Waline](https://waline.js.org/) - 提供了轻量级评论系统
- 所有为此项目贡献代码和想法的贡献者

## 📄 许可证

Stalux 主题基于 MIT 许可证开源，您可以自由地使用、修改和分发。

---

开始使用 Stalux 创建您的博客，展示您的创意与知识吧！如有问题或建议，欢迎通过 GitHub 提交 Issue 或 Pull Request。
