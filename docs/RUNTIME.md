# Stalux 生命周期与静态接口

本说明对应主题当前实现，适用于源码模板和 npm 集成模式。博客仍为静态站点；构建期工作、浏览器工具和开发文档 MCP 分别有明确职责。

## Astro 生命周期

| 阶段 | 工作 | 边界 |
| --- | --- | --- |
| `astro:config:setup` | 注入路由、集成、默认 Sätteri 插件、字体配置及 Vite 转换 | 此时配置还可能被后续集成修改 |
| `astro:config:done` | 用最终 publicDir 同步背景、数学字体与许可；根据最终 outDir 定位输出 | 不重写不变文件，保留消费方自定义资源 |
| `astro:build:done` | HTML 图片/字体 AST 后处理、缓存、Pagefind | 缓存命中直接复用；未命中只解析一次 HTML，变更节点统一输出 |
| `astro:before-preparation` | 包装原导航 loader，预热目标页正文字体 | 最多等待 150ms，最多复用 16 个离线 FontFace；失败/取消不阻断切页，旧页字体不被替换 |
| `astro:before-swap` | 清理旧页观察器、定时器、交互和 WebMCP 注册批次 | 异步旧任务完成后不能继续挂载到新页 |
| `astro:page-load` | 通过共享页面运行时挂载当前 DOM 交互、注册 WebMCP | 去重注册，销毁异常仍释放监听器；持久背景保留跨页状态 |

官方钩子说明见 [Integration API](https://docs.astro.build/en/reference/integrations-reference/) 和 [View Transitions 生命周期](https://docs.astro.build/en/guides/view-transitions/#lifecycle-events)。项目记录了官方文档 MCP `https://mcp.docs.astro.build/mcp`，传输为 Streamable HTTP；查询工具为 `search_astro_docs`。配置保存不等于当前客户端已加载，应实际检查连接并查询。

## Swup 导航与插件边界

实现入口为 [swup-router.ts](../src/scripts/swup-router.ts)，脚本适配见 [navigation-scripts.ts](../src/scripts/navigation-scripts.ts)。Swup 4.10.0 负责导航；Astro 提供静态 HTML。主题将 Swup hooks 转发为页面组件使用的 Astro 生命周期事件。

| 插件 | 职责与范围 |
| --- | --- |
| Body Class | 同步 `page-` 前缀的 body class 和 `data-stalux-*` 属性，排除背景运行时属性；菜单等其他 class 保留 |
| Route Name | 为首页、文章、归档、标签、分类、关于、友链、一言和 404 命名；目标路由名同步到 html 与 main 的路由属性 |
| Fragment | 文章间只替换 `#swup-article`；标签和分类详情间只替换 `#swup-taxonomy`；其他导航替换 `#swup-main` |
| Parallel | 普通导航中旧容器淡出与新内容入场并行；旧容器立即 inert、退出文档流并移除非持久节点的 ID，结束或取消时移除；历史恢复、减少动态和隐藏页面使用串行替换 |
| Scripts | 通过官方 `runScript()` 执行页面脚本；主题适配层负责模块顺序、完成等待、取消和会话去重 |
| Head、Preload、Progress、Scroll、Accessibility、JS | 分别管理 head 资源、预取、进度条、滚动、无障碍与 JS 动画完成等待 |
| Debug | devDependency，仅开发构建动态加载；生产 preview 不加载 |

Debug 在主题源码仓库的开发构建自动启用；消费项目如需同样的日志，可执行 `bun add -d @swup/debug-plugin`。未安装时虚拟模块返回空实现，生产构建不解析该依赖。

页头、页脚和背景位于替换容器之外，保留节点身份。文章间 Fragment 保留主布局和左右侧栏；目录、标签和分类等文章相关 slot 从目标文档刷新。Body Class 不负责组件状态保存。

资源和字体准备完成后，主题在旧容器被替换或并行插入之前派发 `astro:before-swap`；替换后刷新侧栏 slot 并派发 `astro:after-swap`。页面脚本完成后才派发 `astro:page-load`。JS 插件等待入场和旧容器淡出完成，随后结束导航。浏览器原生 View Transition 保持关闭，历史遍历按已保存位置恢复。

普通内联脚本和页面模块按会话去重；`data-astro-rerun` 或 `data-swup-reload-script` 表示每次重新执行，`data-swup-ignore-script` 表示跳过。JSON-LD、import map 和非 JavaScript script 不执行。外部脚本失败或超时后允许重试；导航取消只停止后续执行，不把仍在加载的共享模块当成成功结果。统计 SDK 继续由统计运行时按会话管理，不进入页面脚本重跑范围。

自定义 Fragment 规则必须使用当前页与目标页共有的 ID 容器，且位于 main 内。路由 ID 使用 `swup-` 命名空间，避免与构建期压缩的 `stalux-` CSS class 混用。扩展并行容器时需同时验证快速取消、重复 ID、焦点、目录更新和旧容器清理。

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

## 浏览器阅读路径

目标字体仅提前载入，不安装到旧文档。背景 SVG 低优先级解码，内容过渡结束后再淡入；新导航会使过期准备失效。正文不在路由过渡后再次等待延迟入场动画。Expressive Code 外部 CSS 从正文移到 head，使 Astro 在 swap 前完成预载；后处理不改写正文，也不提取 noscript/template 中的样例引用。归档摘要只响应精确指针悬停或键盘 focus-visible，触屏首次点击必须直接导航。归档月份和分组使用真实流布局，避免嵌套 content-visibility 与估算高度在滚动、软导航后重新展开导致位移。

Google Analytics、Clarity 和 Umami 使用原生 async SDK，每个会话只加载一次，失败后允许后续页面重试；加载和发送不进入路由等待链。Umami 的手动 pageview 捕获触发时的 URL、标题与 referrer，保留 SDK 的点击采集。旧 Partytown 会话跨部署首次进入新运行时会整页刷新一次，避免匿名旧监听器与新上报并存。

官方 `@w3c/webmcp-polyfill` 只提供程序式 API，七个工具在 `astro:page-load` 注册、`astro:before-swap` 注销。生产与 preview 均须在真实浏览器验证工具可被调用，不能仅检查单元测试。

运行时验收方法与本轮证据见 [2026-10-17 实测报告](runtime-performance-2026-10-17.md)。


代码行和 Mermaid 的屏外绘制仅使用可验证的精确尺寸：不换行 EC 行数 × 1lh、SVG viewBox 比例。跳过自定义布局；打印强制可见，代码进入渲染范围时恢复溢出区域的键盘访问。它们与归档月份估算高度不同，不能把同一策略扩展到任意流式内容。

Clarity 自行处理历史导航。主题不跨帧调用 stop/start：0.8.72-beta 异步上传压缩后仍会读取 stop 清空的元数据，因此此候选微优化已撤回。真实采集事件与性能同时验收。

手机文章的阅读时长、字数与访问计数区域需保留能容纳 fallback 字体和计数加载状态的最小高度，允许内容继续扩展。不能只隐藏计数器或延迟显示正文来避免位移；验收需覆盖首次字体替换及 Vercount 从 Loading/隐藏到真实值的过程，并检查正文起点的移动。
