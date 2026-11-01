# WebMCP / AI 代理

Stalux 内置页面内 WebMCP 工具：支持 WebMCP 的浏览器代理或扩展打开站点后，可以调用以下**只读**工具，数据全部来自构建产物，**无需后端**。

> 这不是供桌面 MCP 客户端直接连接的 HTTP `/mcp` 服务；普通静态托管不能处理 MCP JSON-RPC POST 请求。协议以 [WebMCP 社区组草案](https://webmachinelearning.github.io/webmcp/) 为准。

## 工具列表

| 工具 | 功能 | 数据来源 |
| --- | --- | --- |
| `stalux_list_posts` | 分页列出全部文章（含元信息） | `/api/posts.json` |
| `stalux_get_post` | 按 abbrlink / 标题关键词取单篇元信息 | `/api/posts.json` |
| `stalux_current_post` | 当前正在浏览的文章元信息 | `/api/posts.json` |
| `stalux_random_post` | 随机挑一篇文章的元信息 | `/api/posts.json` |
| `stalux_search_posts` | 全文搜索文章 | Pagefind `/pagefind/` |
| `stalux_read_post` | 分段读取 Markdown；未导出时读取已索引纯文本 | Markdown / Pagefind |
| `stalux_site_info` | 站点信息 + `llms.txt` / `llms-full.txt` 入口 | `site.yml`（构建期） |

所有工具均为 `readOnlyHint: true`，不会写入站点数据或主动导航。

## 搜索工具

`stalux_search_posts` 合并已发布元信息中的标题、标签、分类和摘要匹配，以及 [Pagefind JavaScript API](https://pagefind.app/docs/api/) 的正文命中，使用 `meta.title` 和 `plain_excerpt`，附带 `abbrlink` 和完整 URL。

| 行为 | 说明 |
| --- | --- |
| 返回数量 | 每次最多 10 篇并去重 |
| 排序 | 标题匹配优先 |
| 全文索引不可用 | 元信息匹配标记 `source: "metadata"`、`fullText: false` |
| 无匹配且索引不可用 | 返回索引不可用错误，不把故障误报成全文无匹配 |
| 高亮 HTML | 不作为工具摘要返回 |
| 失败加载 | 元信息及 Pagefind 模块的失败加载不会永久占用缓存 |

## 读取工具

`stalux_read_post` 接受 `id`、`offset`（默认 0）和 `maxChars`（默认及上限 50000）。

| 项 | 说明 |
| --- | --- |
| 偏移单位 | UTF-16 单元，不拆开 emoji 等代理对 |
| 开启 `promote.export_md` | 返回 `format: "text/markdown"` 和 `markdown` |
| 未开启 / Markdown 不可用 | 使用 Pagefind 的 `post` 精确过滤读取，返回 `format: "text/plain"` 和 `content`，不承诺保留 Markdown 语法或未索引内容 |
| 续读 | 返回 `totalChars`、`truncated`、`nextOffset`；`nextOffset` 非空时再次传入该偏移，直到为 `null` |
| 都关闭 | 返回 `CONTENT_UNAVAILABLE` |

## 生命周期

工具在 `astro:page-load` 初始化 polyfill 并注册，在 `astro:before-swap` 注销和停止旧注册批次。只发送读取静态资源的请求；不提交搜索词给外部搜索服务、不调用模型、不新增遥测。

文章 `post` 过滤值及 Markdown 导出开关会写入静态 HTML，供本地工具选择实际可用的数据源。`/api/*.json`、Markdown 和 OpenAPI 均为静态文件，不宣称动态配额或固定 `RateLimit-*` 余量。

## 开启 / 关闭

跟随 `stalux/config/ai-discovery.yml` 的 `conformance` 设置：

```yaml
id: ai-discovery
conformance: "essential"   # disabled 时停止注册工具
```

`disabled` 即停止注册工具；`essential` / `recommended` / `complete` 均会启用。

## 浏览器支持

WebMCP 是社区组草案，原生支持取决于浏览器和版本。在无原生 `modelContext` 的浏览器上，Stalux 会自动加载 [`@mcp-b/webmcp-polyfill`](https://www.npmjs.com/package/@mcp-b/webmcp-polyfill) 兜底；原生支持落地后 polyfill 自动失效（no-op），无需改动。

## 相关文件

| 文件 | 作用 |
| --- | --- |
| `stalux/config/ai-discovery.yml` | 启停 AI 发现文件与 WebMCP |
| `stalux/config/promote.yml` | Markdown 导出与 LLM 提示文本 |
| `/llms.txt`、`/llms-full.txt` | 站点 AI 发现入口 |
| `/api/posts.json` | 文章元信息索引 |
| `/openapi.json` | 静态接口描述 |
