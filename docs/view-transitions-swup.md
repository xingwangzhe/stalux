# Swup 页面过渡与生命周期

本文对应 Stalux 1.44.0 的实现。实现以仓库源码为准；本文列出的动画参数是设计与代码预算，不是完整导航耗时、FPS、INP 或跨浏览器性能保证。实际浏览器验证结果由发布验收记录另行提供，未运行的检查不能算作通过。

## 路由由谁负责

Astro 继续负责内容集合、静态 HTML、样式、字体与客户端模块的构建。浏览器端由 Swup 负责链接拦截、预取、页面缓存、历史记录、内容替换和动效时序。主题移除 Astro ClientRouter；Swup 设置 `native: false`，不依赖浏览器 `document.startViewTransition()`。

Swup 的替换容器只有 `main[data-stalux-route]`。header、footer、滚动 sentinel 和背景双层位于 main 外，跨页保留原节点；文章目录、正文、评论、标签云等页面内容随 main 更新。主题布局与组件不再输出 Astro `transition:*` 指令，避免继续生成原生 VT 的编译辅助代码。节点保留来自 Swup 的容器边界，不以 Astro 的 swap 为前提。公开的 `utils/view-transitions.ts` 中兼容性 helper 仍保留，不能把 helper 名称或可选的 `transitionName` 字段当作浏览器正在运行原生 VT 的证据。

代码入口为 [`view-transitions.ts`](../src/scripts/view-transitions.ts) → [`swup-router.ts`](../src/scripts/swup-router.ts)。程序化导航通过 [`navigation-client.ts`](../src/scripts/navigation-client.ts) 进入同一 Swup 实例，标签云不再调用 Astro 的 `navigate()`。正文导出、JSON/XML、图片/PDF、独立 HTML、外站、新标签页及显式 reload 链接保留文档导航行为。

## 官方集成与插件的选择

本次梳理同时核对 Swup 官方文档和 registry 发布包源码。检查时的版本为 `swup@4.10.0`、`@swup/astro@1.8.0`、HeadPlugin 2.3.1、A11yPlugin 5.2.1、PreloadPlugin 3.2.12、ScrollPlugin 4.0.0、JSPlugin 3.2.0。

Swup core 精确锁定为 `4.10.0`。快速连续导航的过期 visit 防护使用已核对源码中的内部 `Visit.abort()`，在 URL/history、head 或 main 更新前停止旧 hook 链；该方法存在于运行时，但未公开在 npm 的 `Visit` 类型中，因此只在本地 helper 中做结构类型声明。升级 Swup 前必须重新核对该内部方法、hook 的 `visit.done` 处理和异步取消行为，并重跑快速点击与延迟旧请求回归，不能直接放宽版本范围。

| 能力 | 本实现的用法 | 原因与边界 |
| --- | --- | --- |
| Swup core | 接管主题页面导航；缓存最多 32 页，历史位置最多保留 64 条 | 控制长时间阅读时的驻留量；这不是无限离线缓存 |
| HeadPlugin | 更新 head 元数据并等待新样式；保留旧样式直到 main 替换，再移除主题页面的旧样式 | 旧页面在目标资源准备期间继续可读；运行中 SDK 插入的样式不机械删除 |
| A11yPlugin | 页面标题播报、忙碌状态、焦点与减少动态偏好 | 正常进入新页面聚焦 main；历史恢复优先保留原列表链接焦点；取消和失败也要清忙碌状态 |
| PreloadPlugin | 预取悬停链接，不预取整个可见链接集合；并发节制 | 避免归档或标签列表一次下载大量文章；仍要处理未预取成功的正常导航 |
| ScrollPlugin | 锚点与常规页面滚动；Stalux 额外按历史索引恢复位置；通过 `scrollFunction` 同步执行 instant 滚动并结算 start/end | 特别覆盖减少动态与浏览器原生手势场景；自定义 instant 回调不添加默认实现的 wheel/scrollend 一次性监听器，避免无位移滚动时监听器持续驻留 |
| JSPlugin | 在 Swup 的 incoming animation 阶段等待 Stalux 的可取消标题动效 | Swup 知道真实结束时间，统计可等待同一个完成信号，背景独立于软导航 |
| `@swup/astro` | 核对源码并作为集成参考，未直接启用 | 当前集成只派发三个裸 Astro 事件，不提供旧代码需要的 URL、signal、目标 Document 等字段；其默认脚本重跑策略也不适合主题已有的页面清理注册表 |
| Fade / Slide / Overlay theme | 未直接套用 | 这些是预设效果，不能表达 Stalux 的路由语义、手机纯淡入与长内容约束；本实现使用 JSPlugin 的分路由策略 |
| ScriptsPlugin | 未全量重跑当前页面的脚本 | 主题控制自己的初始化和清理。首次脚本执行与显式 `data-astro-rerun` 分开处理，避免统计 SDK、全局监听器和评论重复创建 |
| 原生 View Transition / 并行整页副本 / morph | 未作为路由动画基础 | 不拍摄或缩放整篇长文章，不强行匹配 Canvas 标签词、头像或多行标题，也不创建离开的正文副本 |

官方入口：[Astro 集成](https://swup.js.org/integrations/astro/)、[Astro 集成源码与手动初始化说明](https://github.com/swup/astro)、[主题预设](https://swup.js.org/themes/)、[JSPlugin](https://swup.js.org/plugins/js-plugin/)、[配置](https://swup.js.org/options/)。

## 设计稿怎样映射到页面

动效对象是新页可见标题所属的有界引导区，高度不得超过 min(420px, 视口高60%)；超出时退回可见标题。正文、评论、长列表保持可读与原位，main 不做整体动画。目标不可见、文档隐藏或动画 API 不可用时直接结算，不滚回标题播放效果。

策略由 [route-motion-policy.ts](../src/utils/route-motion-policy.ts) 选择，由 [route-motion.ts](../src/scripts/route-motion.ts) 实现。目标 HTML、CSS 和有时限字体准备完成后，旧引导区 80ms opacity 1→.82，桌面 Y0→-4px；手机无位移。下表描述随后新页的单次入场，无人为 delay。

| 场景 / 策略 | 桌面有界引导区 | 手机 |
| --- | --- | --- |
| 普通跨页 glide | opacity .72→1，160ms | 120ms纯淡入 |
| 普通文章间 article | opacity .72→1，Y4px→0，180ms | 120ms纯淡入 |
| 进入内容 enter | opacity .72→1，Y6px→0，180ms | 120ms纯淡入 |
| 返回索引 up | opacity .8→1，Y-4px→0，160ms | 120ms纯淡入 |
| 同维度详情 taxonomy | opacity .72→1，X6px→0，160ms | 120ms纯淡入 |
| 明确上一篇 / 下一篇 | opacity .76→1，X-8px / +8px→0，180ms | 120ms纯淡入 |
| 关于、友链、一言 panel | opacity .76→1，Y4px→0，160ms | 120ms纯淡入 |
| 回首页 home | opacity .76→1，Y4px→0，180ms | 120ms纯淡入 |
| 历史恢复 restore | 恢复阅读位置，不重播内容动画 | 同桌面 |
| 404 error | opacity .85→1，100ms | 120ms纯淡入 |
| reduce、原生手势、隐藏、同URL/hash | 立即可读，不播放 | 同桌面 |

完整55种模块的设计、实现映射和减动画策略见 [MOTION.md](MOTION.md)。

首页、归档、文章、分类/标签索引及详情、关于、友链、说说和 404 统一进入这张策略表。桌面标签 Canvas 的词不参与共享元素 morph，手机标签卡片也不逐项 stagger。原审查稿中的共享标题只是条件式备选，本次不将任意列表标题冒充已经实现的几何匹配。

同 URL 点击保持当前阅读位置；同页 hash 使用锚点滚动，不换 main、不重播页面入场，也不重新选择背景。前进/返回与普通“返回列表”链接不同：前者恢复历史条目的位置，后者仍是新的导航。

说说的 `#word-*` 永久链接更新当前 history 条目时保留 Swup 的 `source`、`index` 与已有自定义状态，并把 `url` 同步为当前 pathname、query 和 hash。普通首次进入带 hash 的说说页面仍在两帧后定位；历史前进/返回不再次自动定位旧 hash，以保留读者后来滚动到的位置。减少动态偏好下，明确点击锚点使用 instant 滚动。

## Astro 兼容生命周期

主题保留现有页面组件监听的事件名称，但事件由 Stalux 的 Swup 桥接派发。它提供本主题使用的 `from`、`to`、`direction`、`navigationType`、`sourceElement`、`signal`，以及准备好后可读取的 `newDocument`。这是主题内部兼容层，不代表完整复刻 Astro ClientRouter 的可替换 loader、swap 或 ViewTransition API。

| Swup 阶段 | Stalux 工作 | Astro 兼容信号 |
| --- | --- | --- |
| 首次文档解析完成 | 注册全局路由，页面运行时执行早挂载；同一 DOM 重复信号去重 | 初始 `astro:page-load` |
| `visit:start` | 保存历史位置/焦点，创建导航代次与 AbortController，选择动效策略，背景保持本会话已选图 | `astro:before-preparation` |
| 加载目标文档后、替换前 | 收集目标脚本，给目标正文字体最多 150ms 准备时间 | `astro:after-preparation` |
| `content:replace` 前半段 | HeadPlugin 等待新样式；旧交互仍在；准备完成才清理旧页面运行时与 WebMCP | `astro:before-swap`，带真实目标 Document；同一事件绑定共享动效 gate |
| 只替换 main 后 | 更新主题页面状态，移除过期主题样式，保留背景与导航节点，执行首次遇到的页面脚本 | `astro:after-swap` |
| `content:scroll` | 常规进入滚到顶部/目标锚点；历史恢复对应条目的位置与链接焦点；可见标题立即开始动画 | 不额外伪造导航 |
| `page:view` | 新模块已注册，挂载计数、评论、目录、标签云等当前 DOM 行为 | `astro:page-load` |
| JSPlugin `in` | 等待同一个已启动的标题动画完成；慢模块不会使已显示标题延后跳动 | 共享 `ready` / `finished` gate |
| `visit:end` / abort / fail | 结算或取消 gate，清导航状态；旧代次不能清新代次 | 释放本次 signal 与页面状态 |

[`page-runtime.ts`](../src/scripts/page-runtime.ts) 继续按全局 key 注册页面行为，在 before-swap dispose，在解析完成或 page-load 挂载。首次挂载不依赖 `window.load`，因此慢图片、统计 SDK、评论服务或 iframe 不应把首访交互一直拖到所有资源加载结束。

首次遇到的页面脚本由 [`navigation-scripts.ts`](../src/scripts/navigation-scripts.ts) 处理：外部脚本以绝对 src 为 key，内联脚本以类型与内容为 key；普通模块保持会话内单次执行，`data-astro-rerun` 显式每次执行；JSON-LD 等数据脚本不当作 JavaScript。新页面模块完成必要注册后才发 page-load。失败的脚本可在后续导航重试，等待有上限；这不等于保证离线或第三方脚本必然成功。

Swup 在目标页未提交时可中止旧 visit，提交后的新导航会按其队列规则运行。动画取消必须同时释放等待；不把“指针点击成功”或“URL 已更新”当作页面初始化与动效完成。

官方依据：[hooks 顺序与 Promise 等待](https://swup.js.org/hooks/)、[visit 元数据](https://swup.js.org/visit/)、[脚本初始化与清理](https://swup.js.org/getting-started/reloading-javascript/)、[ScriptsPlugin 的重跑风险](https://swup.js.org/plugins/scripts-plugin/)、[HeadPlugin](https://swup.js.org/plugins/head-plugin/)、[ScrollPlugin](https://swup.js.org/plugins/scroll-plugin/)。

## 背景、字体和统计

背景仍使用确定性的 SSR 深色底色与两个持久层，内置 WebP 与自定义背景的静态 URL 不进入 `import.meta.glob`。每个完整文档在解析完成后只随机选择并低优先级异步解码一张图，不等待 window.load；首次成功时从暗底用200ms淡显。软导航保持该图，不监听逐页准备/替换事件，不再重复解码和交叉淡入。自定义 `window.__STALUX_BG_URLS__` 保持生效；reduce时直接显示，saveData时不请求装饰图并保留暗底。慢加载或解码失败不阻断阅读。首次旧模块已安装的文档需完整刷新后采用新行为，不安装第二组匿名旧监听器。

目标正文 FontFace 只预热，不在旧页可见期间安装目标字体；字体会话缓存上限保持 16，准备窗口为 150ms。HeadPlugin 的样式等待与页面模块执行各有独立上限，不能把字体 150ms 说成整次导航必在 150ms 内完成。代码块的外部样式仍由生产 HTML 后处理放入 head，让目标样式在换入前准备。

已有 GA、Clarity、Umami 与 Vercount 配置和服务保留。Swup 迁移没有增加统计字段、采样端点或新的遥测服务。原有统计调度继续消费共享内容动效 gate；“SDK 已加载”“页面访问事件已调度”和“服务端实际收到数据”是不同验证结果，不能互相替代。

## 验证边界

发布验收需要在真实 myblog 的独立副本中链接主题进行 dev 检查，再用实体主题包执行生产构建和 preview。真实 myblog 升级发生在副本验证通过之后。此文不把历史 1.41.0 的测量数据算作 Swup 实现的结果。

| 验证项 | 应记录的证据 |
| --- | --- |
| 桌面与手机 | 首访、所有路由类别、代表性长文章/代码/图片页面的截图；保留视口与缓存条件 |
| 导航稳定性 | 主要方向每条至少 20 次、连续真实导航至少 50 次；记录完成、异常、重复挂载和脚本/监听器是否累积 |
| 生命周期 | 首次模块加载、重复进入、评论、计数、标签 Canvas、搜索与 WebMCP 的挂载/清理；快速点击和取消 |
| 历史与锚点 | 深滚动返回位置、列表焦点、同 URL、同页 hash、浏览器前进/后退、减少动态 |
| 背景 | 节点身份保留、完整文档只解码一次、50次软导航图不变、首次200ms/reduce即时、saveData/失败暗底兜底 |
| 样式与字体 | 冷缓存进入第一篇代码文章、正文起点、fallback 字体与计数 Loading 状态；不能只看热缓存 |
| 生产产物 | 页面数、Pagefind、sitemap、隐藏 AI summary；UTC/Asia Shanghai 双构建 RSS 一致 |
| 性能 | 桌面/手机首屏 Lighthouse 至少三次；完整导航时间与标题动画时间分开记录；TBT 不冒充真实 INP |

本次发布的实际数字、失败原因、截图与浏览器覆盖范围请以验收产物为准。无头截图能证明相应帧的页面状态；单张截图不能证明整段动画连续流畅，也不能代替真实设备手势、内存或第三方服务端收数测量。

内置42张背景使用预生成的无损 WebP，保留 SVG 原图与透明度。原 SVG 只有 viewBox，其 auto 背景尺寸等价于 contain；内置 WebP 显式沿用 contain，自定义背景 URL 仍保持原有尺寸。修改原图后用 `bun run backgrounds:build` 重新生成实体资源；消费项目构建只复制资源，不重复栅格化。性能结论以独立 preview 验收报告为准。
