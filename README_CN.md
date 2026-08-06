[English](./README.md) | 中文文档

[![CI](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml/badge.svg?branch=newMain)](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml)

# Stalux — 现代化 Astro 博客主题

**双模式使用：既可作为源码模板 📦，也可作为 npm 插件安装 🔌**

**[stalux.needhelp.icu](https://stalux.needhelp.icu)**

深色主题、高性能的 Astro 博客主题，采用玻璃拟态设计，支持每路由字体裁剪，专注内容阅读体验。

---

## 🚀 快速开始

### 插件模式（推荐）

```bash
bun create astro                    # 选择 minimal 空模板
cd myblog
bun add @xingwangzhe/stalux         # 安装主题（所有依赖自动包含）
bunx stalux init                    # 生成 stalux/ 内容目录
```

然后配置 `astro.config.mjs`：

```ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";
import stalux from "@xingwangzhe/stalux";
import { mermaidHast } from "@xingwangzhe/satteri-mermaid";
import { photoswipe } from "@xingwangzhe/satteri-photoswipe";

export default defineConfig({
    output: "static",
    site: "https://example.com",
    integrations: [
        stalux({ contentDir: "stalux" }),
        sitemap(),
        expressiveCode({ themes: ["dark-plus", "github-light"] }),
    ],
    markdown: {
        processor: satteri({
            features: { math: true, smartPunctuation: true, gfm: true, frontmatter: true },
            hastPlugins: [photoswipe(), mermaidHast({ responsive: true, theme: "dark" })],
        }),
    },
});
```

创建 `src/content.config.ts`：

```ts
import { defineCollections } from "@xingwangzhe/stalux/schemas";
export const collections = defineCollections({ contentDir: "stalux" });
```

```bash
bun run dev  # 开始写作！
```

### 源码模板模式

```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog
cd my-blog
bun install
bun run dev
```

---

## ✨ 功能特性

- 🌙 **暗色主题** + 玻璃拟态设计
- 🔤 **每路由字体裁剪** — 25 MB 字体 → 共享 ~350 KB + 每页 ~1 KB
- 🔍 **全文搜索**（Pagefind 构建时自动索引）
- 📡 **RSS / Atom 订阅**
- 🖼️ **PhotoSwipe** 图片灯箱
- 📊 **Mermaid** 图表和流程图
- 📐 **数学公式渲染**（KaTeX / MathML）
- 💬 **Waline** 评论系统
- 🤖 **LLM 发现文件**（llms.txt / llms-full.txt）
- 🤝 **WebMCP 工具**（W3C 草案，纯前端，供 AI 代理调用）
- ⚡ **视图过渡动画**
- 🌐 **国际化**（英文 / 中文）
- 🏷️ **标签、分类、归档**页面
- 🎨 **组件覆盖系统**（Starlight 风格）
- 🛠️ **YAML 配置** — 无需修改代码

---

## 🔤 字体优化

Stalux 内置 25 MB 中文字体（LXGW WenKai），但访客永远不需要下载完整文件。构建时自动按路由生成最小子集：

| 子集       | 大小      | 内容                                |
| ---------- | --------- | ----------------------------------- |
| 公共子集   | ~350 KB   | UI 文本、导航、国际化、文章共享字符 |
| 每路由子集 | ~0.5–3 KB | 每个页面独有的字符                  |

每个页面只加载 `common.css` + `subset-{route}.css`。覆盖所有路由类型：`/`、`/about`、`/words`、`/posts/*`、`/archives`、`/tags`、`/categories`、`/links`。

基于 `subset-font`（Harfbuzz WASM），构建时和开发模式按需执行。

---

## 🎨 组件覆盖

```ts
stalux({
    components: {
        Navs: "./src/components/CustomNavs.astro",
        Footer: "./src/components/CustomFooter.astro",
    },
});
```

30+ 个组件可覆盖，完整列表见 `src/internal/override.ts`。

---

## 📝 内容目录结构

```
stalux/
├── config/              # YAML 配置文件
│   ├── site.yml         # 站点元信息
│   ├── author.yml       # 作者信息
│   ├── navs.yml         # 导航菜单
│   ├── footer.yml       # 页脚配置
│   ├── links.yml        # 友情链接
│   ├── comment.yml      # 评论配置
│   ├── head.yml         # 统计和自定义 head
│   ├── media-links.yml  # 社交媒体
│   ├── promote.yml      # LLM 推广
│   ├── ai-discovery.yml # AI 发现文件
│   └── typetexts.yml    # 打字机文本
├── posts/               # 博客文章（Markdown）
├── about/index.md       # 关于页面
└── words/               # 随想/语录
```

---

## 🛠️ 开发命令

```bash
bun install     # 安装依赖
bun run dev     # 启动开发服务器 localhost:4321
bun run build   # 构建到 dist/
bun run preview # 预览构建结果
```

---

## 📖 文档

完整文档和在线演示：**[stalux.needhelp.icu](https://stalux.needhelp.icu)**

---

## 🤝 WebMCP / AI 代理

Stalux 内置 WebMCP 工具：当 WebMCP 感知的浏览器（如 Chrome 内置 Gemini、或
[Ask nekuda](https://chromewebstore.google.com/detail/ask-nekuda/amochnnbmnkjjlblolhpddkokhnalkjp)
扩展）打开你的站点时，AI 代理可以直接调用以下**只读**工具与博客交互——**无需任何后端**：

| 工具                  | 功能                                     | 数据来源                  |
| --------------------- | ---------------------------------------- | ------------------------- |
| `stalux_list_posts`   | 分页列出全部文章                         | `/api/post.abbrlink.json` |
| `stalux_search_posts` | 全文搜索文章                             | Pagefind `/pagefind/`     |
| `stalux_read_post`    | 读取文章原始 Markdown                    | `/posts/{abbrlink}.md`    |
| `stalux_site_info`    | 站点信息 + llms.txt / llms-full.txt 入口 | `site.yml`（构建期）      |

所有工具均为 `readOnlyHint: true`，绝不修改任何状态。

**开启 / 关闭：** 跟随 `stalux/config/ai-discovery.yml` 的 `conformance` 设置。
设为 `disabled` 即停止注册工具；`essential` / `recommended` / `complete` 均会启用。

**浏览器支持：** WebMCP 是 W3C 社区组草案（Chrome 149 Origin Trial）。
在无原生 `modelContext` 的浏览器上，Stalux 会自动加载
[`@mcp-b/webmcp-polyfill`](https://www.npmjs.com/package/@mcp-b/webmcp-polyfill)
兜底；原生支持落地后 polyfill 自动失效（no-op），无需改动。

---

## 📄 许可证

MIT License
