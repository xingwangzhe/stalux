[English](./README.md) | 中文文档

[![CI](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml/badge.svg?branch=newMain)](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml)

# Stalux — 现代化 Astro 博客主题

**双模式使用：既可作为源码模板 📦，也可作为 npm 插件安装 🔌**

**[stalux.needhelp.icu](https://stalux.needhelp.icu)**

深色主题、高性能的 Astro 博客主题，采用玻璃拟态设计，支持 unicode-range 字体分片，专注内容阅读体验。

---

## 🚀 快速开始

### 插件模式（推荐）

```bash
bun create astro                    # 选择 minimal 空模板
cd myblog
bun add @xingwangzhe/stalux         # 安装主题（所有依赖自动包含）
bunx stalux init                    # 生成 stalux/ 内容目录
```

然后配置 `astro.config.mjs`。Mermaid（包括 MDAST 识别和 HAST/SVG 渲染）由 Stalux 集成默认注入，无需手动配置：

```ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";
import stalux from "@xingwangzhe/stalux";
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
            hastPlugins: [photoswipe()],
        }),
    },
});
```

创建 `src/content.config.ts`：

```ts
import { defineCollections } from "@xingwangzhe/stalux/schemas/collections";
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
- 🔤 **unicode-range 字体分片** — 25 MB 字体 → ~22 个 woff2 分片，浏览器按需下载命中分片
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

Stalux 内置 25 MB 中文字体（LXGW WenKai）和可变代码字体（Google Sans Code）。访客不需要下载完整文件：构建时把正文字体按 `unicode-range` 切成 ~22 个 woff2 分片（走官方 Astro Fonts API，`fontProviders.local()`），浏览器只下载命中页面字符区间的分片——首屏通常 1–2 个分片（每个 ~200–600 KB）。

每个页面由 `<Font />` 组件输出带连续 `unicode-range` 的 `@font-face`；分片文件名内容寻址、跨构建确定性，保证 `experimental.incrementalBuild` 缓存稳定（需 Astro ≥ 7.2.2）。

基于 `subset-font`（Harfbuzz WASM），构建时切分到 `node_modules/.astro/stalux-fonts/`；local provider 纯本地读文件，构建不联网。

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

### 统计配置

统计工具统一配置在 `stalux/config/head.yml`，不需要修改模板代码：

```yaml
id: head
bingClarityId: "YOUR_CLARITY_PROJECT_ID"
```

`bingClarityId` 是 Stalux 沿用的字段名，实际对应 Microsoft Clarity Project ID。登录 Clarity 后，在项目 **Settings → Setup → Get tracking code** 中获取对应 ID。Stalux 会把异步 tracking code 注入 `<head>`，并在 Astro View Transitions 下保持单个 loader。不要再通过 `anyhead`、Tag Manager 或其他插件重复接入同一个项目。

Project ID 是公开的浏览器标识；不要把 Clarity Data Export API token 写入这个 YAML 或任何前端代码。如果站点使用严格 CSP、Cookie 横幅或 CMP，请由宿主站点自行配置相应策略和同意信号；主题不替站点判断法律合规。

部署后可检查脚本 URL 是否完整保留 Project ID，并在浏览器 Network 中确认出现 `https://www.clarity.ms/collect` 请求。

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

| 工具                  | 功能                                     | 数据来源               |
| --------------------- | ---------------------------------------- | ---------------------- |
| `stalux_list_posts`   | 分页列出全部文章（含元信息）             | `/api/posts.json`      |
| `stalux_get_post`     | 按 abbrlink / 标题关键词取单篇元信息     | `/api/posts.json`      |
| `stalux_current_post` | 当前正在浏览的文章元信息                 | `/api/posts.json`      |
| `stalux_random_post`  | 随机挑一篇文章的元信息                   | `/api/posts.json`      |
| `stalux_search_posts` | 全文搜索文章                             | Pagefind `/pagefind/`  |
| `stalux_read_post`    | 读取文章规范化 Markdown                  | `/posts/{abbrlink}.md` |
| `stalux_site_info`    | 站点信息 + llms.txt / llms-full.txt 入口 | `site.yml`（构建期）   |

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
