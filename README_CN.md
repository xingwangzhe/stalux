[English](./README.md) | 中文文档

[![CI](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml/badge.svg?branch=newMain)](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml)

# Stalux — 现代化 Astro 博客主题

**双模式使用：既可作为源码模板 📦，也可作为 npm 插件安装 🔌**

**[stalux.needhelp.icu](https://stalux.needhelp.icu)**

深色主题、高性能的 Astro 博客主题，采用玻璃拟态设计，支持 native 页面 CJK 字体子集，专注内容阅读体验。

所有 HTML 路由的页脚内置圆形回到顶部按钮：滚动 240px 后显示，点击平滑回顶；遵循系统减少动画设置。按钮在页脚正常布局中显示，不遮挡正文、不改变页面宽度和居中布局，打印时隐藏。无需配置。

首页打字效果由 Stalux 自有组件提供，继续使用 `stalux/config/typetexts.yml` 的 `items` 字符串列表，无需新增配置。默认输入 100ms/字素、删除 33ms/字素，完整文字停留 1500ms、清空后等待 500ms。组件在视口外或后台暂停，支持软导航清理；减少动画时整句轮播且隐藏光标。禁用 JavaScript 时显示首句，屏幕阅读器和打印输出完整列表。

---

## 🚀 快速开始

### 插件模式（推荐）

```bash
bun create astro                    # 选择 minimal 空模板
cd myblog
bun add @xingwangzhe/stalux         # 安装主题（所有依赖自动包含）
bunx stalux init                    # 生成 stalux/ 内容目录
```

需要 Node.js 26 或更高版本。然后配置 `astro.config.ts`。所有插件都由 Stalux 集成默认打包注入，**无需手动配置**：

- **Markdown**：Mermaid（MDAST 识别 + HAST/SVG 渲染）、数学公式（Temml → MathML）、字数统计/特性标记、PhotoSwipe 图片灯箱，全部自动注入默认的 `satteri()` processor（math / frontmatter / gfm / 智能标点默认开启）。
- **Sitemap**：自动打包 `@astrojs/sitemap`（默认收录文章 `/posts/*.md` 原文端点，过滤其它页面的 Markdown 镜像端点）。
- **Expressive Code**：自动打包，默认启用代码块行号。

```ts
import { defineConfig } from "astro/config";
import stalux from "@xingwangzhe/stalux";

export default defineConfig({
    output: "static",
    site: "https://example.com",
    integrations: [stalux({ contentDir: "stalux" })],
});
```

主题颜色可在 `stalux/config/site.yml` 通过可选的 `accentColor` 统一设置，支持六位 HEX，默认 `#EAB308`。该颜色会驱动主题强调色与 Waline 强调色；请确保实际使用的颜色与背景保持足够对比度。

```yaml title="stalux/config/site.yml"
accentColor: "#EAB308"
```

如需自定义内置集成，传入选项即可（传 `false` 可关闭）：

```ts
integrations: [
    stalux({
        contentDir: "stalux",
        sitemap: { filter: (page) => page.startsWith("https://example.com/posts/") },
        expressiveCode: { themes: ["dark-plus", "github-light"] },
    }),
];
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
- 🔤 **Native 页面字体子集** — Rust/N-API 为每页可见中文生成带缓存的 WOFF2 子集
- 🔍 **全文搜索**（Pagefind 构建时自动索引）
- 📡 **RSS / Atom 订阅**
- 🗺️ **Sitemap**（内置打包，文章 `.md` 原文可收录，过滤其它页面的 Markdown 镜像端点）
- 🖼️ **PhotoSwipe** 图片灯箱
- 📊 **Mermaid** 图表和流程图
- 📐 **数学公式渲染**（Temml → MathML）
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

Stalux 内置中文字体 LXGW WenKai 和可变代码字体 Google Sans Code。构建时由 Rust/N-API 包 `@xingwangzhe/cjk-font-split-native` 按页面可见或可展开的 CJK 正文生成内容寻址 WOFF2 子集；字符集相同的页面复用同一个文件。代码和 MathML 中可见的中文也会纳入子集。

每个子集都会无条件保留阿拉伯数字 `0-9`（`RESERVED_GLYPHS`），即使页面里没有任何可见数字。时钟、计数、日期、脚本注入的值等在运行时生成的数字不会出现在构建产物 HTML 中，预留它们可避免数字回退到系统字体。调用方可通过 `writePageFontSubset` 的可选参数 `extraChars` 追加更多预留字符。

子集 CSS 使用精确到字符的 `unicode-range` 和 `font-display: swap`，让可见文本与下载字形对应。代码可变字体仍通过 Astro 官方 local Fonts API 注入。

持久 BLAKE3 缓存键包含字体内容、face index、规范化字符集和算法版本；缓存保存在 `node_modules/.astro/`，可跨页面和增量构建复用。字体输入从本地读取，构建不会联网下载字体。

### 按可见性加载与更新

桌面标签云进入视口附近后才动态加载；切换到移动布局、离屏或页面隐藏时销毁实例以停止动画调度，重新可见后恢复。标签点击沿用 Astro 客户端导航。时钟与页脚运行时间仅在可见时更新，日期仅在跨天时重写。评论在距离视口约半屏（最多 400px）时加载。标签按组、归档按月份、分类按卡片保留静态 HTML 并跳过离屏渲染。

### 现代 JavaScript

TypeScript 使用 ESNext，主题默认将 `vite.build.target` 设为 `"esnext"`，保留现代 JavaScript 语法并减少兼容转换；消费方显式指定的 target 优先。此目标面向现代浏览器，不会自动补齐缺失的 Web API，也不代表普通脚本会使用 GPU。自有源码由 Biome 的 `noVar`、`useConst` 错误规则约束；第三方依赖和构建器生成的代码不在这项源码约束内。

### 首屏 CSS 与搜索样式

主题默认使用 Astro 的 `build.inlineStylesheets: "never"`，共享样式作为带哈希、可缓存的外部 CSS 输出，组件专用样式按页面加载。样式表正常阻塞首次绘制，避免无样式内容闪烁；消费项目显式设置 `build.inlineStylesheets: "always"` 可恢复内联，但会增加每页 HTML 大小。

Pagefind 搜索弹窗样式单独输出为带哈希的静态文件，以 `prefetch` 提示浏览器提前获取；打开搜索时才作为样式表启用，并等待加载完成后显示弹窗。它不阻塞正文首屏，也不依赖搜索 JavaScript 动态生成 CSS 文件；无脚本访问保留 `<noscript>` 样式回退。

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
│   ├── author.yml       # 作者信息（name/avatar/bio/jobTitle）
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

> 当前分支的 Partytown 迁移是未发布候选。典型路由测试中 TBT 下降，但首页和分类页的 LCP 存在回退，尚未完成性能验收。以下说明描述候选实现。

`stalux()` 内置 Partytown：Google Analytics、Clarity 和 Umami 的第三方脚本在 Web Worker 中执行，消费项目无需额外添加 Partytown 集成。主题通过 `astro:page-load` 发送页面统计，并在支持 `Element.moveBefore()` 的浏览器中保留导航期间的 worker。Vercount 在主窗口异步加载，避免可见计数等待 worker 启动和跨线程 DOM 通信；每次 `astro:page-load` 后执行一次，重新绑定新页面计数节点，并读取当前 URL 和本站访客 Cookie。

使用 Google Analytics 时，请在 **管理 → 数据流 → 增强型衡量 → 网页浏览量 → 高级设置** 关闭“根据浏览器历史记录事件判断的页面更改”。主题已设置 `send_page_view: false` 并显式发送每次导航的 URL 和标题；GA 的历史自动统计需要在后台单独关闭，否则软导航会重复计数。其他增强型衡量选项可以保留。参见 [Google 页面浏览量文档](https://developers.google.com/analytics/devguides/collection/ga4/views)。

`bingClarityId` 是 Stalux 沿用的字段名，实际对应 Microsoft Clarity Project ID。登录 Clarity 后，在项目 **Settings → Setup → Get tracking code** 中获取对应 ID。Stalux 会通过 Partytown 加载 tracking code，并在支持保留 worker 的浏览器中保持单个 loader。不要再通过 `anyhead`、Tag Manager 或其他插件重复接入同一个项目。

Project ID 是公开的浏览器标识；不要把 Clarity Data Export API token 写入这个 YAML 或任何前端代码。如果站点使用严格 CSP、Cookie 横幅或 CMP，请由宿主站点自行配置相应策略和同意信号；主题不替站点判断法律合规。

部署后可检查脚本 URL 是否完整保留 Project ID，并在浏览器 Network 中确认出现 Clarity `/collect` 请求（收集域名可能为 `a.clarity.ms` 等区域端点）。

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

### 作者 JSON-LD 配置

`stalux/config/author.yml` 支持可选的 `jobTitle` 字段。填写后，Stalux 会把它写入首页和文章页面 JSON-LD 的 `Person` 实体，帮助 Agent 识别作者的公开职业角色；它不会改变页面上的作者卡片样式：

```yaml title="stalux/config/author.yml"
id: author
name: xingwangzhe
avatar: /avatar.png
bio: Blog Theme Stalux
jobTitle: Software Engineer # 可选；输出为 JSON-LD Person.jobTitle
```

这是构建期元数据配置，不会创建联系 API，也不会暴露私密信息；只应填写本来就准备公开的职业称谓。


## 开发诊断日志

Stalux 使用 Astro 官方 logger 输出集成、内容加载和页面生成日志。普通模式保留初始化摘要、警告和错误；详细模式记录配置与路由注入、组件覆盖、字体分片缓存、Markdown 分析缓存、内容统计、feed、资源同步和 Pagefind 阶段信息。

```bash title="Stalux 开发诊断"
bun run dev:debug
bun run build:debug
# 消费主题的项目也可以直接运行：
STALUX_DEBUG=1 bun run dev --verbose
STALUX_DEBUG=1 bun run build --verbose
# 只静默 Astro 日志；独立 verify:build 的验收结果仍会输出：
bun run astro -- build --silent
```

| 日志位置 | 行为 |
| --- | --- |
| 终端 | 集成使用 `logger.fork("stalux/模块")`；页面使用 `Astro.logger`，端点和 loader 显式传递上下文 logger。支持 Astro 的日志级别、自定义 destination 和 `--silent`。 |
| 浏览器控制台 | 独立轻量封装，统一 `[stalux/模块]` 前缀。详细信息只在开发模式且 `STALUX_DEBUG=1` 或 `--verbose` 时输出；需要在 DevTools 中显示 Verbose 日志。生产构建只保留警告和错误。 |
| 内容诊断 | `getStaticPaths()` 没有运行时 logger，纯计算函数由上层或 Astro 报告异常；数学错误沿 Sätteri 的诊断机制报告，避免重复错误。 |

浏览器日志覆盖页面挂载/清理、软导航、搜索、灯箱、评论、WebMCP、背景和外部统计脚本。日志不会上传到服务端，也不会新增遥测；不主动记录搜索词、文章正文、完整配置或凭据。错误保留模块、原因和堆栈，并过滤常见 token、密码和 URL 查询参数；第三方错误可能仍含业务信息，分享前请检查。

Astro 7.3 的集成 `logger.debug()` 使用官方 `DEBUG/--verbose` 通道，不进入自定义 JSON destination；`info/warn/error` 和渲染阶段诊断走配置的 destination。需要静默运行时不要同时启用 `--verbose` 或 `DEBUG`。

耗时只写入日志，不写入静态页面或缓存键。正常构建与详细构建切换后可能需要一次重新构建，同一模式连续构建保持确定性。使用 `astro dev --background` 的消费项目可通过 `astro dev logs` 查看终端日志。

维护依赖时保留 TypeScript 6 别名以支持 `astro check`；Vitest 与 `@vitest/coverage-v8` 同步升级。所有质量检查使用 `bun run validate`。

## 样式开发与输出

Stalux 使用 UnoCSS 在主题内预编译样式，消费项目无需安装或配置 UnoCSS。共享 CSS 默认作为可缓存的外部样式表输出，正文、数学、归档、分类、标签和短句样式随相应组件加载。显式设置 Astro 的 `build.inlineStylesheets: "always"` 可恢复内联输出。自定义组件新增的 UnoCSS utilities 需要消费方自行编译。样式维护位置与开发监听参见 [STYLING.md](./docs/STYLING.md)。

文章页宽屏使用 280px 左右侧栏和最多 1920px 的整体布局；外侧内边距 16px，小于 1600px 时收起两侧栏。样式由 UnoCSS 构建，正文及第三方集成样式使用标准 CSS，发布构建检查不允许 Tailwind 变量或未编译指令。

友情链接列表最大宽度为 1600px，左右内边距各 16px；卡片填满网格列，随屏幕宽度使用一至五列布局。

文章正文和摘要卡最大宽度为 840px。摘要读取文章原有 `desc`，为空时不显示；Markdown 引用块显示为提示卡，无需新增配置或修改文章语法。
