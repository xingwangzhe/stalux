[English](./README.md) | 中文文档

[![CI](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml/badge.svg?branch=newMain)](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml)

# Stalux — 现代化 Astro 博客主题

**双模式使用：既可作为源码模板 📦，也可作为 npm 插件安装 🔌**

**[stalux.needhelp.icu](https://stalux.needhelp.icu)**

深色主题、高性能的 Astro 博客主题，采用玻璃拟态设计，支持 native 页面 CJK 字体子集，专注内容阅读体验。

所有 HTML 路由的页脚内置圆形回到顶部按钮：滚动 240px 后显示，点击平滑回顶；遵循系统减少动画设置。按钮在页脚正常布局中显示，不遮挡正文、不改变页面宽度和居中布局，打印时隐藏。无需配置。

首页打字效果由 Stalux 自有组件提供，继续使用 `stalux/config/typetexts.yml` 的 `items` 字符串列表，无需新增配置。默认输入 100ms/字素、删除 33ms/字素，完整文字停留 1500ms、清空后等待 500ms。组件在视口外或后台暂停，支持软导航清理；减少动画时整句轮播且隐藏光标。禁用 JavaScript 时显示首句，屏幕阅读器和打印输出完整列表。

独占段落的图片 `![图片说明](url)` 会在构建期通过 satteri HAST 自动生成 `figure` 和 `figcaption`，在图片下方显示居中的灰色小字；保留图片 alt 和 PhotoSwipe 灯箱，无需配置或浏览器脚本。空描述、行内图片、同段多图及已有 figure 不重复生成图注。说明按纯文本输出，特殊字符自动转义。

代码块默认固定为 `dark-plus` 暗色主题，不跟随系统明暗偏好，也不生成主题切换选择器。需要自定义时，可通过 `expressiveCode` 显式覆盖 `themes`、`useDarkModeMediaQuery` 和 `themeCssSelector`。此行为仅改变构建生成的代码样式，不增加遥测。

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
- **Sitemap**：自动打包 `@astrojs/sitemap`（`promote.export_md: true` 时收录已发布文章 `/posts/*.md` 导出端点，默认过滤其它页面的 Markdown 镜像端点）。
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
        expressiveCode: { themes: ["dark-plus"], useDarkModeMediaQuery: false },
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
  通过 `@xingwangzhe/satteri-mermaid@0.8.2` 使用 Merman，默认 `dark` 主题和透明画布。插件支持 11 个主题预设，完整选项见 [配置说明](https://github.com/xingwangzhe/satteri-mermaid/blob/v0.8.2/docs/configuration.zh-CN.md)。默认渲染失败会抛错。
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

子集 CSS 使用精确到字符的 `unicode-range` 和 `font-display: swap`，让可见文本与下载字形对应。代码可变字体仍通过 Astro 官方 local Fonts API 注入。 正文字体子集在 HTML head 中使用同源 `preload`，无需消费方手写字体链接。

持久 BLAKE3 缓存键包含字体内容、face index、规范化字符集和算法版本；缓存保存在 `node_modules/.astro/`，可跨页面和增量构建复用。字体输入从本地读取，构建不会联网下载字体。

多页面构建通过 `FontSubsetter` 复用已准备的字体和哈希状态，冷缓存时最多同时运行四个原生分片任务，避免每页重复读取、复制和哈希完整字体。字体输入先解码/提取为 SFNT，再复用 HarfBuzz 预处理结构，保留原始轮廓；WOFF2 使用 Google Brotli，质量仍为 8。图片尺寸、加载策略、关联 CSS 文本和字体字符提取共享一次 HTML 解析；共用图片尺寸与 CSS 生成文本也在同一次构建内复用，在同一棵 parse5 AST 上修改图片与字体节点，最后按源码位置统一输出一次；脚本、注释、模板和未改子树保留原文。

本地图片尺寸使用 `image-size` 探测，增加 SVG、AVIF 等格式支持。常规文件最多读取 512 KiB；JPEG 尺寸标记位于文件开头或超出该窗口时，兼容兜底可能读取完整文件。已有尺寸属性和远程图片保持原样。被引用资产使用流式摘要，同 URL 内容变化会使页面缓存失效，不再按图片扩展名限制。

页面后处理结果另外缓存到 `node_modules/.astro/stalux-page-output/`。缓存检查原始 HTML、页面路径、实际依赖的本地 CSS/图片内容，以及字体和处理代码；相关输入变化、字体缓存文件丢失或记录损坏时会重新处理。未变化页面可以直接恢复后处理结果，Pagefind 仍在每次构建后完整生成索引。保留 `node_modules/.astro/` 才能跨构建受益；清除该目录会安全重建缓存。

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

Google Analytics、Clarity 和 Umami 使用低优先级的原生异步脚本，每个 SDK 在会话中只加载一次，加载失败不会阻塞正文或站内导航。Vercount 在每次 `astro:page-load` 后重新绑定计数节点。GA 显式发送每页 pageview；Umami 关闭 SDK 自动 pageview，保留点击事件采集，并在异步加载前记录各页 URL、标题和 referrer，避免快速导航时串页。已有旧版 Partytown 会话首次遇到新运行时会整页刷新一次，避免旧监听器重复上报。

使用 Google Analytics 时，请在 **管理 → 数据流 → 增强型衡量 → 网页浏览量 → 高级设置** 关闭“根据浏览器历史记录事件判断的页面更改”。主题已设置 `send_page_view: false` 并显式发送每次导航的 URL 和标题；GA 的历史自动统计需要在后台单独关闭，否则软导航会重复计数。其他增强型衡量选项可以保留。参见 [Google 页面浏览量文档](https://developers.google.com/analytics/devguides/collection/ga4/views)。

`bingClarityId` 是 Stalux 沿用的字段名，实际对应 Microsoft Clarity Project ID。登录 Clarity 后，在项目 **Settings → Setup → Get tracking code** 中获取对应 ID。Stalux 异步加载 tracking code，并在软导航期间保持单个 loader，由 SDK 自行处理历史导航。不要再通过 `anyhead`、Tag Manager 或其他插件重复接入同一个项目。

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

Stalux 内置页面内 WebMCP 工具：支持 WebMCP 的浏览器代理或扩展打开站点后，可以调用以下**只读**工具，数据全部来自构建产物，**无需后端**。这不是供桌面 MCP 客户端直接连接的 HTTP `/mcp` 服务；普通静态托管不能处理 MCP JSON-RPC POST 请求。协议以 [WebMCP 社区组草案](https://webmachinelearning.github.io/webmcp/) 为准。

| 工具                  | 功能                                     | 数据来源               |
| --------------------- | ---------------------------------------- | ---------------------- |
| `stalux_list_posts`   | 分页列出全部文章（含元信息）             | `/api/posts.json`      |
| `stalux_get_post`     | 按 abbrlink / 标题关键词取单篇元信息     | `/api/posts.json`      |
| `stalux_current_post` | 当前正在浏览的文章元信息                 | `/api/posts.json`      |
| `stalux_random_post`  | 随机挑一篇文章的元信息                   | `/api/posts.json`      |
| `stalux_search_posts` | 全文搜索文章                             | Pagefind `/pagefind/`  |
| `stalux_read_post`    | 分段读取 Markdown；未导出时读取已索引纯文本 | Markdown / Pagefind |
| `stalux_site_info`    | 站点信息 + llms.txt / llms-full.txt 入口 | `site.yml`（构建期）   |

所有工具均为 `readOnlyHint: true`，不会写入站点数据或主动导航。

`stalux_search_posts` 合并已发布元信息中的标题、标签、分类和摘要匹配，以及 [Pagefind JavaScript API](https://pagefind.app/docs/api/) 的正文命中，使用 `meta.title` 和 `plain_excerpt`，附带 `abbrlink` 和完整 URL。每次最多返回 10 篇并去重，标题匹配优先。全文索引不可用时，已有元信息匹配会标记 `source: "metadata"`、`fullText: false`；没有匹配则返回索引不可用错误，不把故障误报成全文无匹配。Pagefind 的高亮 HTML 不作为工具摘要返回；文章元信息及 Pagefind 模块的失败加载不会永久占用缓存。

`stalux_read_post` 接受 `id`、`offset`（默认 0）和 `maxChars`（默认及上限 50000）。偏移按 UTF-16 单元计数，不拆开 emoji 等代理对。开启 `promote.export_md` 时返回 `format: "text/markdown"` 和 `markdown`；关闭导出或 Markdown 文件不可用时，使用 Pagefind 的 `post` 精确过滤读取，返回 `format: "text/plain"` 和 `content`，不承诺保留 Markdown 语法或未索引内容。返回的 `totalChars`、`truncated`、`nextOffset` 用于续读：`nextOffset` 非空时再次传入该偏移，直到它为 `null`。关闭 Markdown 导出且关闭 Pagefind 时返回 `CONTENT_UNAVAILABLE`。

工具在 `astro:page-load` 初始化 polyfill 并注册，在 `astro:before-swap` 注销和停止旧注册批次。只发送读取静态资源的请求；不提交搜索词给外部搜索服务、不调用模型、不新增遥测。文章 `post` 过滤值及 Markdown 导出开关会写入静态 HTML，供本地工具选择实际可用的数据源。`/api/*.json`、Markdown 和 OpenAPI 均为静态文件，不宣称动态配额或固定 `RateLimit-*` 余量。

**开启 / 关闭：** 跟随 `stalux/config/ai-discovery.yml` 的 `conformance` 设置。
设为 `disabled` 即停止注册工具；`essential` / `recommended` / `complete` 均会启用。

**浏览器支持：** WebMCP 是社区组草案，原生支持取决于浏览器和版本。
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


## 页面加载与软导航

根页面使用稳定滚动条空间和明确行高，避免字体换入或页面高度变化引起布局跳位。首页打字区域按完整文案预留最大换行高度，文本起点固定；时钟预留行高并使用等宽数字。文字、光标和页面过渡动画仍然保留，无需新增配置。

切页通过 Astro ClientRouter 的 `astro:before-preparation` 包装原 loader，提前加载目标页的正文字体，再进行 DOM swap。等待最多 1 秒；字体失败、超时或导航取消不会阻断页面切换，也不会提前替换旧页字体。慢网络下首次加载仍可能出现系统字体回退；第三方内容和没有尺寸的远程图片仍需内容作者自行预留空间。减少动态效果和打印规则保持生效。

维护细节见 [样式维护](docs/STYLING.md) 和 [生命周期与静态接口](docs/RUNTIME.md)。开发 Astro API 时可使用 [官方文档 MCP](https://mcp.docs.astro.build/mcp)；项目连接配置见 `.codex/config.toml`、`.mcp.json` 和 `AGENTS.md`。该开发 MCP 与博客前端 WebMCP 是不同接口。

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

文章页宽屏使用 280px 左右侧栏和最多 1544px 的整体布局；外侧内边距 16px，小于 1600px 时收起两侧栏。样式由 UnoCSS 构建，正文及第三方集成样式使用标准 CSS，发布构建检查不允许 Tailwind 变量或未编译指令。

友情链接列表最大宽度为 1600px，左右内边距各 16px；卡片填满网格列，随屏幕宽度使用一至五列布局。

文章正文和摘要卡最大宽度为 840px。摘要读取文章原有 `desc`，为空时不显示；Markdown 引用块显示为提示卡，无需新增配置或修改文章语法。

访客天气默认关闭：在 `stalux/config/site.yml` 设置 `weather: { enabled: true }` 后，显示于页脚文字区域（含访客 IP 和近似位置）及桌面文章右侧时钟下方；省略或设置为 `false` 则关闭。进入可见区域后自动向 IP.SB 查询（失败时回退到 IPinfo） IP 近似城市，再向 Open-Meteo 查询天气，不调用浏览器 GPS。外部服务会接收到访客 IP，Open-Meteo 还会收到保留两位小数的经纬度。20 分钟的会话缓存只保存城市、访客 IP 与天气，不保存经纬度；VPN 可能显示出口城市。后台、视口外及 Astro 软导航会停止工作；接口失败显示重试，并保留上次天气。Open-Meteo 免费接口仅限非商业使用并受调用额度限制，组件附数据来源及许可链接。无需服务端接口或新增依赖。

归档保留透明背景的单列年／月时间线，所有文章始终展开。月份首次进入视口时以 280ms 轻微位移和淡入，使用浏览器原生 API，无新增依赖。减少动画、打印、缺少浏览器 API 及禁用 JavaScript 时保持完整静态列表；手机端日期位于标题上方，长标题自然换行。无需新增配置。 文章标题悬停只保留一条下划线；鼠标悬停或键盘聚焦时在右侧预览原有 `desc`，靠近视口边缘时移到下方。空摘要不显示预览，触屏仍直接打开文章。 摘要预览使用浏览器顶层浮层，不受父容器裁剪及普通层级遮挡；不支持时使用高层级回退。

### 生产样式名称压缩（1.35.0）

源码和开发服务器保留可读的样式名称。生产构建在 Astro 编译与资源哈希生成之前，用主题随包发布的固定映射压缩 Stalux 私有 class、CSS variables 和 keyframes；模板模式与 npm 集成模式使用相同映射。HTML、CSS、客户端选择器和动态 SSR 动画名称同步转换，映射及转换器内容进入增量缓存指纹。

`data-*` 行为钩子、文章锚点、`--font-body` / `--font-code` 及兼容覆盖变量 `--accent` / `--foreground-60p`、第三方组件接口和用户文章中的自定义名称保持原义。扩展组件请使用自己的 class、公开组件接口和稳定的行为属性，不依赖生产私有类名或 `s*` / `--s*` / `k*` 输出名称；这些短名称由主题保留。公开样式导入路径保持兼容，消费项目不需要增加配置或安装 UnoCSS。

主题自有规则使用原生 CSS nesting、现代 `rgb(... / alpha)`、`overflow-wrap: anywhere` 和 `clip-path: inset(50%)`；输出使用 Lightning CSS 的现代浏览器目标，去除已不需要的旧兼容展开。多行截断和第三方 MathML 等仍有实际浏览器需求的适配保留，不能以删除必要规则来换取体积数字。生产 sourcemap 默认关闭，避免公开原名称映射。

构建会检查 CSS、HTML 和 JavaScript 中的未压缩私有名称、Tailwind 指纹及资源引用。文章正文与代码示例不属于指纹清理对象。Wappalyzer 的检测规则及缓存会变化；构建检查通过与某个检测器版本的实际扫描结果分别报告。

主题代码使用 MIT；字体保留各自许可。LXGW WenKai 与 Google Sans Code 使用 OFL 1.1；Latin Modern Math 使用 GUST Font License。数学辅助字体 Stalux Math Aux 从 KaTeX 的 OFL 字体独立重建，不使用含 FontCreator 非商用元数据的 Temml 字体。花体字母轮廓保持一致；撇号使用 OFL 来源并保持原边界、宽度和重复间距，曲线略有不同。字体与许可全文会同步到消费项目的 `public/fonts/`；旧版本留下的 `Temml.woff2` 已不再被引用，可删除。生成脚本和源文件位于 `scripts/build-math-font.py` 与 `scripts/font-sources/`。

## LICENSES 与许可范围

主题代码采用 **MIT**，根 [LICENSE](LICENSE) 保持标准许可全文，以便 GitHub 识别。内置字体保留自己的许可，不会因主题使用 MIT 而变成 MIT。独立许可文件及适用范围如下：

| 组件 / Component | 许可 / License | 全文 / Full text |
| --- | --- | --- |
| Stalux 主题代码 | MIT | [LICENSE-MIT.txt](LICENSES/LICENSE-MIT.txt) |
| LXGW WenKai | OFL-1.1，含保留名称与网页字体额外许可 | [LXGW-WenKai-OFL.txt](public/fonts/LXGW-WenKai-OFL.txt) |
| Google Sans Code | OFL-1.1 | [Google-Sans-Code-OFL.txt](public/fonts/Google-Sans-Code-OFL.txt) |
| Stalux Math Aux（由 KaTeX OFL 字体数据重建） | OFL-1.1，独立名称 | [StaluxMathAux-OFL.txt](public/fonts/StaluxMathAux-OFL.txt) |
| Latin Modern Math | GUST Font License / LPPL-1.3c | [LICENSE-GUST.txt](LICENSES/LICENSE-GUST.txt) |
| LPPL 1.3c 完整正文 | LPPL-1.3c | [LICENSE-LPPL-1.3c.txt](LICENSES/LICENSE-LPPL-1.3c.txt) |
| OFL 1.1 标准正文 | OFL-1.1 | [LICENSE-OFL-1.1.txt](LICENSES/LICENSE-OFL-1.1.txt) |
| 字体版权、保留名称与修改声明汇总 | 按各字体原许可 | [LICENSE-FONT-NOTICES.txt](LICENSES/LICENSE-FONT-NOTICES.txt) |

`LICENSES/` 和 `public/fonts/` 许可全文随 npm 包分发；构建时字体声明同步到消费项目 `public/fonts/`，使线上 WOFF2 文件与许可一并可访问。原生分片依赖的独立声明见 [cjk-font-split-native LICENSES](https://github.com/xingwangzhe/cjk-font-split-native#licenses-与许可范围) 及其 npm 包内 `THIRD_PARTY_LICENSES.txt`。GitHub 主许可显示用于识别主题代码；字体与其他第三方组件必须按此表分别判断。
