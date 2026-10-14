# Stalux 生命周期与静态接口

本说明对应主题当前实现，适用于源码模板和 npm 集成模式。博客仍为静态站点；构建期工作、浏览器工具和开发文档 MCP 分别有明确职责。

## Astro 生命周期

| 阶段 | 工作 | 边界 |
| --- | --- | --- |
| `astro:config:setup` | 注入路由、集成、默认 Sätteri 插件、字体配置及 Vite 转换 | 此时配置还可能被后续集成修改 |
| `astro:config:done` | 用最终 publicDir 同步背景、数学字体与许可；根据最终 outDir 定位输出 | 不重写不变文件，保留消费方自定义资源 |
| `astro:build:done` | HTML 图片/字体 AST 后处理、缓存、Pagefind | 缓存命中直接复用；未命中只解析一次 HTML，变更节点统一输出 |
| `astro:before-preparation` | 包装原导航 loader，预热目标页正文字体 | 最多等待 1 秒，失败/取消不阻断切页，旧页字体不被替换 |
| `astro:before-swap` | 清理旧页观察器、定时器、交互和 WebMCP 注册批次 | 异步旧任务完成后不能继续挂载到新页 |
| `astro:page-load` | 通过共享页面运行时挂载当前 DOM 交互、注册 WebMCP | 去重注册，销毁异常仍释放监听器；持久背景保留跨页状态 |

官方钩子说明见 [Integration API](https://docs.astro.build/en/reference/integrations-reference/) 和 [View Transitions 生命周期](https://docs.astro.build/en/guides/view-transitions/#lifecycle-events)。项目记录了官方文档 MCP `https://mcp.docs.astro.build/mcp`，传输为 Streamable HTTP；查询工具为 `search_astro_docs`。配置保存不等于当前客户端已加载，应实际检查连接并查询。

## AST 与缓存

生产后处理在同一棵 parse5 AST 上修改真实 img/style/link 元素，收集正文字符和 CSS 生成文本。输出器基于源码位置只序列化变化节点，保留未改 HTML、脚本、注释和模板示例。Markdown 统计使用已有 MDAST/HAST；导出用 YAML Document AST 序列化元数据，正文保留原文并追加版权脚注。

| 缓存 | 生命周期与失效 |
| --- | --- |
| 图片尺寸与 CSS 读取 | 单次构建内共享；有界任务队列默认并发 4 |
| 原生字体子集 | `node_modules/.astro/`，键含字体内容、字符集、face 与算法版本 |
| 页面后处理 | `node_modules/.astro/stalux-page-output/`，跟踪 HTML、页面路径、处理代码及引用资产内容；损坏/缺失自动重建 |
| 路由恢复 | 主题 YAML 内容进入 runtime cache key；文章 HTML、分类/标签与 Markdown 导出共享此键 |
| Pagefind | 每次构建重新生成完整索引；浏览器成功模块复用，失败加载可重试 |

不得通过清空真实消费项目缓存掩盖配置失效问题。改 `promote.export_md` 或工具启停时，要检查恢复 HTML 中的实际开关及已生成文件。

## 三种 AI 接口

| 接口 | 使用方式 | 实际能力 |
| --- | --- | --- |
| Astro 官方文档 MCP | 开发客户端连接官方 HTTP MCP 服务 | 查询 Astro 开发文档，与博客内容无关 |
| 博客 WebMCP | 代理打开博客页面，通过浏览器 `document.modelContext` 调用 | 7 个只读工具；元信息、全文检索、分段阅读、当前文章和站点信息 |
| 静态机器可读文件 | HTTP GET `/api/posts.json`、`/openapi.json`、`/llms.txt` 等 | 构建产物；不处理 MCP POST、不提供动态认证/写入/限流配额 |

文章搜索合并元信息与 Pagefind 正文命中，返回纯文本摘要；全文失败时明确标记降级。阅读优先 Markdown，未导出则用 Pagefind `post` 精确过滤读取纯文本；缺少两种来源时返回不可用错误。长文通过 `nextOffset` 续读，返回格式与总长度，不静默丢弃后续内容。详细参数见中英文 README 的 WebMCP 章节。

## 发布验收

执行 `bun run validate` 和 `bun pm pack --dry-run`。先用原始配置和内容的独立实体消费副本构建，检查全部 HTML 的资源引用、Agent 摘要存在且被 CSS 裁切、字体、Pagefind 与 sitemap；再按仓库流程发布 1.x 包。正式包和 tarball 可读后升级 myblog，连续两次构建核对增量恢复，推送并分别确认 Cloudflare/EdgeOne 部署及线上版本。

CSS 维护与浏览器测量边界见 [STYLING.md](STYLING.md)。实验室 CLS、微基准、整体构建和真实用户指标分别报告；工具数量稳定不构成堆内存无泄漏的证明。
