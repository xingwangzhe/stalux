# Stalux development instructions

## Astro 官方文档 MCP（优先使用）

涉及 Astro API、集成钩子、构建阶段或 ClientRouter 生命周期时，优先查询 **Astro 官方文档 MCP**，再结合本项目安装版本的源码核对行为。不能仅因当前会话工具列表没有 Astro，就判断官方没有 MCP。

- 官方服务：<https://mcp.docs.astro.build/mcp>；传输方式：**Streamable HTTP**（不是旧 SSE transport）。
- 官方说明：<https://docs.astro.build/en/guides/build-with-ai/>；服务源码：<https://github.com/withastro/docs-mcp>。
- 工具名：`search_astro_docs`；参数：`{"query":"要查询的 Astro 问题"}`。工具前缀由客户端生成，以实际 `tools/list` 为准。
- Codex 项目配置已保存在 `.codex/config.toml`；支持通用 HTTP MCP 配置的客户端可参考 `.mcp.json`。这是开发工具配置，不是博客前端的 WebMCP，也不需要新增 npm 依赖。
- Codex 只在受信任项目中加载项目配置；新配置可能需要重新加载 MCP 或开启新会话才能出现在工具列表。使用 `codex mcp get astro-docs` 核对是否加载，不能把“配置已保存”等同于“当前会话已连接”。配置格式见 <https://developers.openai.com/codex/mcp/>。
- 调用失败时记录具体连接错误，再临时使用官方网页或 Context7；不要静默替代官方 MCP。只发送文档问题，不上传项目源码、凭据或用户内容。

2026-10-14 已直接通过官方端点完成 `initialize`、`tools/list` 和 `tools/call` 检查，服务返回 `Astro Docs server`，并提供 `search_astro_docs`。生命周期查询成功返回 Integration API、ClientRouter 生命周期和 `publicDir` 的官方文档条目。HTTP 响应使用 `text/event-stream` 是 Streamable HTTP 的合法响应格式，不代表应配置旧 `/sse` 端点。

### 主题生命周期职责

| 阶段 | Stalux 职责 |
| --- | --- |
| `astro:config:setup` | 更新配置、注入路由与脚本、注册 Markdown 插件和 Astro Fonts 配置。此处的 `config` 不能当成所有集成都执行后的最终配置。 |
| `astro:config:done` | 使用最终 `publicDir` 同步主题背景和数学字体，使用最终 `outDir` 确定正文字体输出位置。资源同步早于开发服务器和生产构建的资源管线，保留不变文件与用户自定义资源。 |
| `astro:build:done` | 处理已经生成的 HTML、图片尺寸、逐页字体、页面缓存及 Pagefind 索引。 |
| `astro:page-load` | 通过 `src/scripts/page-runtime.ts` 挂载当前 DOM 的交互；WebMCP 也在此注册当前页工具。晚加载的补偿微任务不能覆盖已经发生的导航事件。 |
| `astro:before-swap` | 清理页面交互、注销 WebMCP 工具并中止旧页注册批次；等待中的注册完成或失败后不能继续注册后续工具。 |

页面字体由构建期 AST 写入同源 `preload`；软导航在 `astro:before-preparation` 包装原 loader，准备目标页字体后再进入 swap，最多等待 1 秒，失败和取消不阻断导航。不得在旧页尚可见时安装目标页 FontFace，也不得无限等待字体。打字区域通过重叠的完整文案预留最大换行高度，时钟行高和滚动条空间必须稳定。

背景跨页淡入淡出、View Transition 路由属性和统计服务属于跨页生命周期；不得机械地在每次换页时销毁持久状态。清理异常仍需释放共享页面运行时的监听器和注册键。50 次模拟事件的回归测试用于验证工具注册数量与注销，不等同于真实浏览器的 50 次导航内存测量。

### Markdown / HTML AST 边界

生产 HTML 后处理在页面缓存未命中时只解析一棵 parse5 AST，在同一棵树上修改图片属性、移除旧字体样式、读取内联 CSS 和正文字符、插入字体样式。最后通过 `src/internal/html-output.ts` 按 AST 源码位置只序列化变更节点、统一输出一次，保留未改子树的源码；缓存命中时不解析。不要在这些阶段反复拼接整页 HTML，也不要用正则匹配 HTML 标签。脚本、注释、模板中的标签示例不能当成真实元素处理。已有字符串兼容入口可保留，但生产管线应调用 AST 入口。

构建期 `markdownPropagationPlugin()` 仅为空载入 `.md/.markdown?astroPropagatedAssets` 转发模块；Astro 后续内容资源传播 transform 会生成实际导入。不得跳过真实 Markdown 内容模块、直接导入、文件页面或 MDX。此优化依赖 Astro 7 的内部转发标记，升级 Astro 时必须核对对应 transform 仍完全忽略输入，并对比代码高亮、图片、样式、搜索和导出产物。仅对已核对的 Astro 7.4.0 启用；其他版本自动回退正常管线，不扩大匹配范围。

构建性能对照使用独立消费项目副本与 `scripts/benchmark-builds.py --node <Node 26 原生二进制绝对路径>`；临时目录可能被 Vite Plus 的默认运行时切换到其他 Node 版本。基线与候选必须固定相同 Node/Bun、worker 数量、内容和缓存场景，报告完整命令 wall time 与峰值 RSS，不能把不同运行时或冷/热缓存差异当成优化收益。

字数和阅读时间的独立 AST 分析器必须设置 `syntaxHighlight: false`。它只消费统计 metadata，不能为统计加载 Shiki 语法或高亮每个代码块；文章页面仍由 Expressive Code 正常高亮。并行预渲染的每个 worker 有独立模块缓存，不能把“模块级缓存一次”误认为“整个构建进程树只计算一次”。

Markdown 特性统计继续复用 Sätteri MDAST/HAST 插件。Markdown 导出复用内容集合的已解析元数据，用 YAML `Document` AST 序列化 frontmatter；正文原样输出，不为导出再解析、重排 Markdown。浏览器交互的实时 DOM 与构建期 AST 是不同职责。

### 静态博客 WebMCP 与增量缓存

页面工具只读取静态 JSON、Markdown 和 Pagefind。Pagefind 的标题是 `meta.title`；摘要使用 `plain_excerpt`。文章页的 `post` 过滤绑定 `data-stalux-post-id`，可用 `search(null, { filters: { post: id } })` 精确读取已索引纯文本。Markdown 未导出时不得把 HTML 404/SPA 回退当成 Markdown；分段输出必须返回格式、总长度、截断标记及续读偏移。部分元信息搜索必须明确 `fullText: false`。不得给静态端点伪造动态限流余量或不存在的 HTTP 错误协议。

主题 YAML 配置必须进入共享 `runtime-cache-key`，文章 HTML、分类/标签页及文章 Markdown 端点复用此键。只按文章日期恢复会忽略 `promote.export_md`、AI 工具启停、版权和站点配置变动。配置变动验收必须检查恢复页面里的实际开关；不能用清空真实项目缓存掩盖失效缺陷。

## Astro 7.4 开发与构建

官方依据：[Astro 7.4 发布说明](https://astro.build/blog/astro-740/)。Stalux 的 Astro 开发依赖与 peer 依赖最低要求统一为 `^7.4.0`；安装依赖仍使用 Bun，刚发布版本使用官方 registry。

| 能力 / 变更 | 开发时如何使用 / 注意事项 |
| --- | --- |
| 构建耗时报告 | `astro build --timings` 展示构建阶段、Vite 插件、Markdown/高亮、页面渲染、图片和集成耗时。Stalux 的 `bun run build` 与 `bun run build:debug` 默认带此参数；独立诊断用 `bun run astro build --timings`。保留完整命令总耗时，样式构建和产物验证也有成本。 |
| 并行预渲染（实验性） | `experimental.parallelPrerender: true` 默认使用可用 CPU 核心数减一的 worker；可用 `{ workers: 4 }` 限制数量。每个 worker 按 `build.concurrency` 并发，增加内存占用；可与 `incrementalBuild` 配合。先看 timings，再对比总耗时、峰值内存、restored 和产物完整性，不默认开启。适配器提供自定义预渲染时不生效，官方 `@astrojs/cloudflare` 属于此情况。 |
| 图片服务分离 | `image.service` 可分别配置 `build` 与 `runtime`；`build` 也用于开发。集成读取服务时先判断 `'runtime' in service`，不能假定总有 `service.entrypoint`。单服务配置继续有效，静态博客无需为此改成 SSR。 |
| 自定义预渲染兼容 | 包装 `setPrerenderer()` 时透传 `getStaticPaths()` / `render()` 的 metadata，避免图片漏生成。旧的纯数组 / 纯 Response 返回形式已废弃；使用 `@astrojs/cloudflare` 或 `@astrojs/markdoc` 时同步检查适配版本。 |
| 字体诊断 | 内置 font provider 支持警告不受支持的字重、样式、子集和格式。自定义 provider 的 `getFontProperties()` 在 Astro 7 可选、Astro 8 将必需；`init()` 上下文新增带临时失败重试的 `fetch()`。Stalux 使用本地 provider，升级后检查字体警告与产物。 |
| 自定义入口 404 | 自行组合 `astro/hono` 或 `astro/fetch` handler 时，在 `pages()` 前加 `notFound()`；一体化 `astro()` 已包含该行为。普通静态博客无需添加运行时入口。 |
| 静态跳转页（实验性） | 开启 `experimental.redirectPage` 后创建 `src/pages/3xx.astro`，接收 `from/to/status/delay` props；必须输出指向 `to` 的 meta refresh。按需渲染页面的 HTTP 重定向不受影响。 |
| Node.js 与输出目录 | Astro 最低支持版本提高到 Node.js 22.22.0，检查本机和 CI；Stalux 自身的 `engines.node >=26` 要求仍然适用。集成调整输出目录时使用 Vite 各环境最终解析的 `outDir`；自定义预渲染器可读取 `outputDirectories`。 |

## 版本线与发布禁令（最高优先级）

Stalux 的软件著作权登记版本属于 **1.x.x**。此项目必须长期保持 **1.x 大版本**，发布版本只允许 `1.<minor>.<patch>`；这是项目的硬性产品约束，优先于通常的 SemVer 主版本升级建议。

- **严禁发布、打 tag、提交或推送任何 `2.x.x` 版本**，包括 `2.0.0`。即使改动包含破坏性 API，也必须留在 `1.x.x` 版本线内处理；不得以 SemVer 规范为由 bump 到 2。
- 修改 `package.json` 的 `version`、创建 release tag 或触发 npm 发布前，先确认版本严格匹配 `^1\.\d+\.\d+$`，并确认 tag 严格为对应的 `v1.x.x`。不确定时停止发布操作，不能自行升级主版本。
- 版本只能在 1.x 内递增，例如 `1.27.1 → 1.27.2` 或 `1.27.1 → 1.28.0`。npm `latest` dist-tag 也必须始终指向 1.x 稳定版。
- 发布前必须确认 GitHub workflow 对 `2.x.x` 有明确失败守卫，而不只是检查 tag 与 `package.json` 相等；CI 检查通过后才可推送 `v1.x.x` tag。
- 仓库历史中曾误发 `2.0.0`，该版本已在 npm 标记为废弃。不要重新发布 2.x，也不要移除该版本的废弃提示；后续发布以当前 1.x 最新稳定版本为基线。

如果发现工作区、tag、workflow dispatch 参数或拟议变更会产生 `2.x.x`，必须阻止发布并报告原因，不能尝试通过强推、覆盖 tag 或改 dist-tag 绕过此约束。

## Configuration and documentation release contract

Any new or changed user-facing configuration field must be handled as one change set:

1. Update the Zod schema and all runtime consumers.
2. Search every relevant Markdown document (`README.md`, `README_CN.md`, and `stalux/posts/*_config*.md`) and document the field, default/optional behavior, output surface, and privacy implications.
3. Add or update a focused build assertion for the generated public artifact. For JSON-LD/config changes, parse the generated HTML or JSON rather than relying only on TypeScript compilation.
4. Run `bun run check:fix`, `bun run validate`, and `bun pm pack --dry-run`.
5. Bump the package version, commit the implementation and docs together, push the branch and annotated tag, wait for CI/npm visibility, then upgrade `myblog` and run two builds.

Do not add a configuration field only to satisfy a third-party score. It must have a real Stalux runtime consumer, documented semantics, and a safe static-site behavior. Do not document dynamic API, rate-limit enforcement, MCP, authentication, or other capabilities that a static deployment cannot actually provide.

### Astro content collection defaults: consumer compatibility gate

Astro's YAML content collection loader may omit Zod `.default()` values from `entry.data` in consuming projects. Treat schema defaults as validation/type documentation, not proof that the runtime value exists. For each new optional config field, set or normalize its default in the shared runtime config accessor (and keep any value-generating helper defensive where appropriate), then build an isolated copy of a real consumer whose config does not include the new key.

**Incident: 1.29.0 `site.accentColor`.** The schema declared `#EAB308`, but production myblog's `site.yml` omitted the field and Astro rendered `undefined`; its first build failed on `/404` with `Invalid Stalux accent color "undefined". Expected #RRGGBB.`. Fixed in 1.29.1 by normalizing the site config in `getSiteData()` and adding a `#EAB308` fallback in `getAccentColorStyle()`. Regression coverage asserts the helper's missing-value fallback. An isolated myblog clone with the unmodified config then built 696 pages, indexed 698 Pagefind pages, and generated a sitemap index. Keep the production consumer untouched until the clone passes.

### Version-release visual regression gate (mandatory)

Every version update must explicitly check the homepage for the Agent-discovery content regression fixed in v1.25.5:

1. The Agent summary must remain present in the SSG-generated static HTML artifact so crawlers can read it. This is build-time output, not runtime SSR.
2. The same summary must be visually hidden with the approved clipped/one-pixel technique and must not enter normal layout flow.
3. Do not use `display: none`, the `hidden` attribute, or `aria-hidden` as a substitute for the static HTML content; do not render the summary as an ordinary visible section.
4. After every `bun run build`, assert both conditions against `dist/index.html` (content marker present and visual-hidden CSS present), then inspect a rendered homepage or screenshot when the homepage layout has changed.
5. A failed visual-regression check blocks version bump, commit, tag, npm publish, and downstream `myblog` upgrade until fixed.

Stalux and the consuming `myblog` remain SSG/static-first. Do not introduce Astro SSR output, a runtime server endpoint, or server-only rendering just to satisfy an Agent readiness audit. Use build-time generated HTML, static JSON, Markdown, RSS, sitemap, and WebMCP client behavior where they are genuinely supported.

## Search-engine submission guidance

Stalux 是主题源码仓库。搜索引擎提交通常属于消费主题的博客仓库，而不是主题仓库。处理线上博客时，要区分“IndexNow 接受通知”和“搜索引擎已经收录”，也不要把 OAuth token、refresh token、API key、密码或其他凭据写入源码。

### IndexNow

myblog 仓库 `/home/xingwangzhe/桌面/博客/myblog` 的 `public/` 目录包含已验证的 IndexNow key 文件：

```text title="myblog IndexNow key files"
public/c7852e354cdc4aae8fe2b3984eeae49d.txt
public/e2d755e6d8db4efabbbfdcf2a403769a.txt
public/f3b7969bca754c47b9a37ff077d7d297.txt
```

部署后，文件内容必须等于文件名，并且能通过 `https://xingwangzhe.fun/<key>.txt` 访问。发布文章后，可以提交 canonical URL：

```bash title="Submit a published myblog URL to IndexNow"
KEY='c7852e354cdc4aae8fe2b3984eeae49d'
URL='https://xingwangzhe.fun/posts/<abbrlink>/'
curl -fsS -o /tmp/indexnow-response -w 'HTTP %{http_code}\n' \\
  -X POST 'https://api.indexnow.org/indexnow' \\
  -H 'Content-Type: application/json; charset=utf-8' \\
  --data "{\"host\":\"xingwangzhe.fun\",\"key\":\"$KEY\",\"keyLocation\":\"https://xingwangzhe.fun/$KEY.txt\",\"urlList\":[\"$URL\"]}"
cat /tmp/indexnow-response
```

提交前先确认文章 URL 返回 `200`。IndexNow 的 `HTTP 200` 只证明通知被接受，不证明已经抓取或收录。

### Google Search Console 与 gcloud 的边界

普通博客文章使用 Google Search Console URL Inspection：打开 `https://search.google.com/search-console`，选择已验证的 `xingwangzhe.fun` 属性，检查完整 canonical URL，然后点击“请求编入索引”。这是外部提交动作；遇到 CAPTCHA、重新登录、二次验证或最终确认时必须交给用户。

本机当前只确认 `gcloud auth list` 显示 `xingwangzhe@outlook.com` 已登录，未确认 active GCP project。gcloud 登录状态不等于 Search Console 所有权，也不等于 Google Indexing API 权限。没有用户明确授权和已验证的 API 配置时，不要创建凭据、请求 OAuth scope、发送 URL 或声称已经通过 gcloud 提交。

### 验证

发布后分别检查文章 URL、canonical、robots、sitemap、IndexNow 响应和 Search Console 状态。把“submitted/accepted”“Google request submitted”和“indexed”作为三个不同状态记录。
