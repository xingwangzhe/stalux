# Stalux development instructions

## ⚠️ 时区红线（最高优先级，2026-10-24 全站 +8h 事故）

**无时区的日期串必须按站点时区解析，禁止裸 `new Date(日期字符串)`。**

- 事故：frontmatter `date: "2026-10-24 12:55:00"`（无时区）被 `parseDate`→`new Date()` 按**构建机器本地时区**解析；EdgeOne 构建机是 UTC → RSS pubDate、`atom:updated`、页面 `<time datetime>`、og/JSON-LD、`api/posts.json` 全体 +8h。本机对照实验定案：同源码 `TZ=UTC` 构建的 rss.xml 与线上一字不差，`TZ=Asia/Shanghai` 正确。站点配置的 `timezone` 只用于格式化，不参与解析——这就是当时的漏洞。
- 修复（1.41.2–1.41.4）：`dayjs.ts` 新增 `parseDate(v, timeZone?)` / `parseDateInZone()` / `zonedCalendarParts()`，无时区串按站点时区挂钟解析（DST 迭代收敛）；`getSiteData()` 给 `timezone` 加了运行时兜底（与 schema 默认一致，沿用 1.29.1 accentColor 模式）；`semantic-time.ts`、`feed.ts`、`archivesList.astro`（归档分组改站点时区日历）、`head.astro`（og/JSON-LD）、`api/posts.json`、footer buildtime 全部接入站点时区。**排序用途的 `toTimestamp` 调用（ai-discovery、content-index 内部）可不含时区：同一批 naive 串统一平移不改变相对顺序，但新代码一律建议传。**
- **日期格式硬规则（1.41.4，schema 层强制）**：`PADDED_DATETIME_PATTERN`（`src/schemas/collections.ts`）要求月/日/时/分/秒**必须补零**，posts 与 words 的 `date`/`updated` 不合规直接构建失败。原因：未补零（`2026-6-9 9:11:00`）绕过站点时区解析器，静默回退 `new Date()` 按构建机器时区解释——myblog 双 TZ 对照实测抓到 4 篇此类旧文 RSS 仍差 8h。**禁止放宽该正则去"兼容"未补零写法；正确做法是修内容文件。** words 的 `sourceDate` 是自由文本（"1950"、"春秋"），不套此规则。允许的合法形式：补零的 `YYYY-MM-DD HH:mm:ss`（推荐）、日期-only `YYYY-MM-DD`、ISO 8601 带显式时区偏移。
- 三层回归闸门，改日期逻辑必跑：
  1. 单测 `tests/dayjs-timezone.test.ts`（期望值全部用 `Date.UTC` 表达，机器时区无关；`TZ=UTC bun run test:run tests/dayjs-timezone.test.ts` 必须同样全绿）；
  2. `verify-build.ts` 时区一致性闸门：RSS/Atom 前 3 个 item 的 pubDate 必须 == frontmatter 墙钟按站点时区解析的时刻 == 文章页 `<time datetime>`（CI 在 UTC 机器上跑，天然暴露回归）；
  3. 发版前双 TZ 对照：`TZ=UTC` 与 `TZ=Asia/Shanghai` 各构建一次，`dist/rss.xml` 必须逐字节一致（先删 `node_modules/.astro`，**增量缓存会跨 TZ 污染 HTML**——实测热缓存下换 TZ 构建会出现"页面用旧时区解析值、RSS 用新值"的自相矛盾产物）。
- 今后新增任何消费日期的代码，必须传站点时区给 `parseDate`/`toTimestamp`/`formatInTimeZone`，并补对应单测；review 时凡见 `new Date(` 包着字符串字面量/模板串的都要警惕。

## 云平台操作：CLI 优先（用户明确要求）

查询 CI/CD、部署状态、构建日志、项目配置和其他云平台信息时，默认使用 CLI，不主动打开网页控制台。

| 平台 | 首选工具 | 执行规则 |
| --- | --- | --- |
| Cloudflare | `cf` CLI | 本工作区默认使用 `cf`；项目存在 Wrangler 配置时按项目约定使用 Wrangler。命令发现先用匿名任务描述执行 `cf cli search`，再查匹配命令的帮助和 schema。 |
| 腾讯云 / EdgeOne | `tccli`（腾讯云 CLI，用户称 tccl） | 优先查询 `tccli` 已支持的只读 API；EdgeOne Makers/Pages 接口若不在当前 `tccli` SDK 中，先核对命令能力，再使用已登录的 `edgeone` CLI 或其官方只读 API，不因 CLI 没有直接子命令就转向网页。 |
| 网页控制台 | 用户明确要求或同意后使用 | 不自行转向网页控制台。CLI/API 确实受限时，先说明具体限制，由用户决定是否使用网页；获准后默认系统浏览器，任务结束不关闭标签页。 |

凭据只从现有 CLI 登录状态或本地配置读取，不打印 token、SecretId、SecretKey，不写入 AGENTS.md、源码、日志或提交。CI 耗时须核对同一 commit，区分平台构建阶段、排队/安装/发布和整条部署流水线，不能用 GitHub 检查结果回传时间代替真实构建时间。

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
| `astro:page-load` / 文档解析完成 | 通过 `src/scripts/page-runtime.ts` 挂载当前 DOM 的交互；WebMCP 也在此注册当前页工具。首访的 `astro:page-load` 由 `window.load` 派发，要等完所有图片、字体与第三方资源，**不能作为首屏唯一挂载点**：文档解析完成（`readyState` 为 `interactive`/`complete`）即用补偿微任务挂载本页，`page-load` 负责软导航后的新页面与同一页的重复信号（早挂载已接管时不再挂第二次）。晚加载的补偿微任务不能覆盖已经发生的导航事件，同一页也不能挂载两次。 |
| `astro:before-swap` | 清理页面交互、注销 WebMCP 工具并中止旧页注册批次；等待中的注册完成或失败后不能继续注册后续工具。 |

页面字体由构建期 AST 写入同源 `preload`；软导航在 `astro:before-preparation` 包装原 loader，为目标页字体最多预留 150 毫秒，再进入 swap；会话内最多保留 16 个独立 FontFace，复用进行中或已完成的载入，失败可重试，取消不阻断导航。不得在旧页尚可见时安装目标页 FontFace，也不得无限等待字体。打字区域通过重叠的完整文案预留最大换行高度，时钟行高和滚动条空间必须稳定。

背景在 before-preparation 低优先级预解码，page-load 后等待内容 View Transition 完成再淡入；过期导航的解码结果不得提交。根 html 必须有稳定深色底色，不能仅依赖异步 SVG。文章标题和正文直接可读，不再叠加延迟 360ms 的内容入场动画。背景跨页淡入淡出、View Transition 路由属性和统计服务属于跨页生命周期；不得机械地在每次换页时销毁持久状态。清理异常仍需释放共享页面运行时的监听器和注册键。50 次模拟事件的回归测试用于验证工具注册数量与注销，不等同于真实浏览器的 50 次导航内存测量。

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

## 运行时消费方验收

改运行时先链接 Stalux 到独立 myblog 副本进行 dev 测试，再安装实体打包内容构建两次并测试 preview。插件模式按项目真实根目录判断，不按导入路径是否包含 node_modules 判断。副本放在与主题有共同工作区父目录的位置；Astro 7.4 在跨 /tmp 与 /home 的外部组件样式虚拟路径上可能误解析。集成钩子、Vite 插件改动后显式重启 dev；普通源码热更新不能证明钩子已重载。

Pagefind CSS 的虚拟模块只在 dev 返回已允许访问的文件 URL，避免 CSS ?url 被 Astro 当作模块脚本请求；生产仍走 Vite 正常的哈希资源管线。dev 默认不生成 Pagefind 索引，验收搜索结果时可把同内容快照的生产 pagefind 目录复制到副本 public/pagefind，不能因此改真实项目。

WebMCP polyfill 5.1.0 的声明式观察器优化只过滤不影响工具定义的文本/样式变化；表单、外置控件和标签、slot、开放 shadow tree 的变化仍需同步。源码匹配失败或版本变化时使用原实现。必须在真实浏览器验证表单新增、属性修改、移除与 shadow tree，不得只验证七个程序式工具。

手机和桌面分别测冷/热加载与站内点击。Lighthouse 首屏分数不能代表软导航 INP；记录 HTML/样式准备、字体等待、swap、内容可见和过渡结束的独立时间，布局变化同时报告包含近期输入的原始位移。每条主要路线至少 20 次，Lighthouse 至少三次；真实连续导航至少 50 次，内存和监听器在相同页面、相同稳定等待后比较。不要把首次加载模块造成的增长当成持续泄漏，也不要把强制 GC 导致的第三方弱引用异常隐藏。

本轮命令、固定页面与原始报告保存在工作区 work/runtime-20261017/；Node 固定为 26.12.0。官方 Astro Docs MCP 本轮规划阶段返回 HTTP 403 / Error 1010，生命周期依据官方文档和安装的 Astro 7.4.0 源码核对。

统计 SDK 使用浏览器原生异步脚本和低网络优先级；不再通过 Partytown 转发 DOM 事件。GA 保留配置队列与每次 page-load 的单次手动 pageview；Umami 使用 data-auto-pageview=false，保留 SDK 的点击事件能力，并在 SDK 加载前捕获每页 URL/title/referrer，不能把排队访问全部归到最后一页。SDK 加载/发送失败不得拒绝路由流程，失败加载允许后续页面重试。已打开的旧 worker 会话首次遇到新运行时会整页刷新一次，防止旧匿名监听器与新实现重复上报。

归档预览只能在桌面悬停或键盘 focus-visible 时出现；触屏/鼠标 focusin 不得吞掉导航点击。浮层优先右侧，窄屏下应避开标题并按可用空间限制高度；链接点击立即收起浮层。验收必须覆盖靠近视口底部的标题首次触屏点击，不能只测页面中间位置。

正式导航计时禁用持续截图、DOM 快照与样式轮询；重型 CDP 轨迹单独录制。首次目标访问与字体预热单列，再采集 20 次有效热导航。记录原生 preview 的 no-cache 与已核对线上 immutable 哈希资源策略之间的差别，不把缓存策略差异冒充源码优化。布局位移按每次导航和标准会话窗口分析，不能把整个多页测试累计的 layout-shift 值当成单页 CLS。

归档列表的月份和文章分组使用真实流布局，不嵌套 content-visibility:auto 与固定估算高度。长标题和手机换行使估算失真，进入视口或返回归档时会产生明显位移；若以后重新引入跳过布局，须在真实内容中覆盖跨月份滚动、返回归档和 CLS，不可只看首屏分数。

生产后处理必须将 Expressive Code 正文里的外部样式引用移到 head（跳过 noscript/template 示例），让 Astro 路由在 swap 前预载代码 CSS。仅隐藏正文的延迟动画会掩盖首次软导航的无样式代码闪现，不能替代关键样式准备；冷缓存进入第一篇代码文章也须检查位移。


代码密集文章只对已确认不换行的 Expressive Code 行容器使用 `content-visibility:auto`，以实际 `.ec-line` 数量乘继承 `1lh` 保留精确块高度；自定义高度/containment 或 wrap 模式必须跳过。Mermaid 仅处理带有效 viewBox 的真实生成 SVG，以精确 aspect-ratio 保留尺寸，不能给普通图标加估算高度。打印必须强制展开，延后绘制后仍要检查横向滚动、完整复制和键盘 tabindex；读取 scrollWidth 前先确认容器已经绘制，不要为了检测溢出强制展开所有屏外代码。生产缓存键必须包含此处理源码，不能恢复缺少优化标记的旧 HTML。

Clarity 的历史导航由原生 SDK 自行处理，主题不跨帧调用 stop/start 暂停录制。0.8.72-beta 的异步压缩上传在 stop 后仍读取已清空元数据，拉长停止窗口会暴露 null.sequence 异常；不要用这项微优化换取短期分数。真实 SDK 必须继续加载和发送；每次发布检查首次进入加多次切换的 GA/Umami 页面事件数量与实际 URL，并确认 Clarity 继续采集。

本轮复测脚本与参数保存在 `../work/runtime-20261017/`。使用显式 Node 26 路径，通过 `powerprofilesctl launch --profile performance --reason 'Stalux runtime audit' --appid stalux-runtime sh run-final.sh` 临时固定电源档位；脚本结束自动释放。单独运行 `node audit.mjs <label> <preview-or-cache-proxy-url> 20`、`node stress.mjs <label> <preview-url>`（手机加 `DEVICE=mobile`）与 `python3 lighthouse-run.py <label> <preview-url>`；每次运行前记录源码、包和内容快照，不复用不同候选的 JSON。审计网络拦截会关闭 Playwright HTTP cache，不得将阻断服务后的时延与正常热缓存结果直接比较。

手机文章的阅读时长、字数与访问计数区域需保留能容纳 fallback 字体和计数加载状态的最小高度，允许内容继续扩展。不能只隐藏计数器或延迟显示正文来避免位移；验收需覆盖首次字体替换及 Vercount 从 Loading/隐藏到真实值的过程，并检查正文起点的移动。
