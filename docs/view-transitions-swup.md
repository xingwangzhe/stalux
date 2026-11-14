# Swup 页面过渡与生命周期

本文对应 Stalux 1.59.0 的实现。实现以仓库源码为准；本文列出的动画参数是设计与代码预算，不是完整导航耗时、FPS、INP 或跨浏览器性能保证。实际浏览器验证结果由发布验收记录另行提供，未运行的检查不能算作通过。

## 路由由谁负责

Astro 继续负责内容集合、静态 HTML、样式、字体与客户端模块的构建。浏览器端由 Swup 负责链接拦截、预取、页面缓存、历史记录、内容替换和动效时序。主题移除 Astro ClientRouter；Swup 设置 `native: false`，不依赖浏览器 `document.startViewTransition()`。

Swup 的替换容器只有 `main[data-stalux-route]`。header、footer、滚动 sentinel 和背景双层位于 main 外，跨页保留原节点；文章目录、正文、评论、标签云等页面内容随 main 更新。主题布局与组件不再输出 Astro `transition:*` 指令，避免继续生成原生 VT 的编译辅助代码。节点保留来自 Swup 的容器边界，不以 Astro 的 swap 为前提。`utils/view-transitions.ts` 现在只保留服务端与客户端共用的 `getRouteKind`；1.41 时代为 ClientRouter 生成 `transition:animate` 配置的 `getRouteAnimation` / `getSidebarAnimation`、以及生成 `view-transition-name` 的 `getPostTitleTransitionName` 已随 ClientRouter 一起删除，因为它们在 Swup 接管后没有任何消费者。

### 客户端没有任何 Astro 路由/VT 运行时

下表是 1.56.0 生产构建（myblog 实体主题包，753 个页面）的实测结果，不是设计意图：

| 检查项 | 结论 | 核对方式 |
| --- | --- | --- |
| `ClientRouter` / `astro:transitions` 脚本 | 未注入 | 生产 HTML 无对应 `<script>`，`_astro/*.js` 无派发端 |
| `transition:name` / `transition:animate` / `transition:persist` | 0 处 | 源码 grep 为 0 |
| `view-transition-name` | 0 处 | 生产 HTML grep 为 0 |
| `document.startViewTransition` | 仅出现在 Swup core 的 `native` 分支 | `native: false`，该分支不执行 |
| `data-astro-prefetch` | 已删除（原本 11 个文件 16 处） | 生产 HTML grep 为 0 |
| Astro 预取运行时 | 消费站点无（未配置）；demo 已改 `prefetch: false` | 产物 `_astro/*.js` 中无 `prefetchAll` / `MutationObserver` 预取派发端 |

`data-astro-prefetch` 是本次清理的重点，但它的性质要分清：Astro 的内置预取**不依赖** ClientRouter，而是由 `astro.config` 的 `prefetch` 配置注入运行时。主题自身的 demo 构建曾开着该配置，于是同一批链接同时被 Astro 预取和 Swup 预取覆盖；消费站点（myblog 的 `astro.config.ts` 没有该键）则根本没有 Astro 预取运行时，组件上的属性既不预取也不报错，属纯残留。现在两处一起收口：组件不再输出该属性，demo 配置改为 `prefetch: false`。预取职责只有一处——Swup PreloadPlugin 的 hover/focus/touchstart，以及首页导航的 idle 预热（`route-prefetch.ts`）。

`PostContent` 仍接受 `transitionName` / `transitionScope`：它们是覆盖组件（`src/internal/override.ts`）的既有 props，删掉会让下游自定义实现报类型错误，而他们在主题自己的渲染路径里已不再产生任何 CSS。同理，`utils/view-transitions.ts` 只保留 `getRouteKind`，被删的三个 VT 辅助函数不对应任何稳定的公开契约。

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
| ProgressPlugin | `delay: 80`、`transition: 200`，主题色 3px 条 | Swup 要拿到目标文档才开始任何动画（`animation.wait` + `await page`），这段纯网络等待原本只有 300ms 后才出现的进度条兜底。80ms 让预取命中的导航完全不显示进度条，需要真实往返时又能在点击后立刻给出反馈；进度条本身只有一次合成层变换 |
| ScrollPlugin | 锚点与常规页面滚动；Stalux 额外按历史索引恢复位置；通过 `scrollFunction` 同步执行 instant 滚动并结算 start/end | 特别覆盖减少动态与浏览器原生手势场景；自定义 instant 回调不添加默认实现的 wheel/scrollend 一次性监听器，避免无位移滚动时监听器持续驻留 |
| JSPlugin | 在 Swup 的 incoming animation 阶段等待 Stalux 的可取消标题动效 | Swup 知道真实结束时间，统计可等待同一个完成信号，背景独立于软导航 |
| `@swup/astro` | 不引入，任何形式的依赖里也不出现 | 它把依赖锁在 `@swup/scroll-plugin` 3.x：`scroll-plugin` 4.0.0 于 **2025-08** 发布（`scrollFunction` 等能力只在 4.x），而集成层到 **2026-02** 仍未跟进。主题要的正是 4.0.0 的自定义 `scrollFunction`，用集成层等于先降级再包一层。此外该集成的全部工作是 `astro:config:setup` 里 `injectScript('page', buildInitScript(options))`：注入一段序列化配置的字符串脚本，在客户端新建 Swup 实例。它无法表达本主题需要的 `SwupJsPlugin` 自定义动画、`scrollFunction`、`ignoreVisit`、并行 + fragment 容器组合与 visit hook 时序；默认值还与本主题相反（`loadOnIdle: true` 把路由初始化推迟到 idle，`reloadScripts: true` 整页重跑脚本）。硬接入 `new Swup()` 让 `swup@4.10.0` 与 11 个官方插件直接受控，是这套动效与生命周期的前提 |
| Fade / Slide / Overlay theme | 未直接套用 | 这些是预设效果，不能表达 Stalux 的路由语义、手机纯淡入与长内容约束；本实现使用 JSPlugin 的分路由策略 |
| ScriptsPlugin | 未全量重跑当前页面的脚本 | 主题控制自己的初始化和清理。首次脚本执行与显式 `data-astro-rerun` 分开处理，避免统计 SDK、全局监听器和评论重复创建 |
| 原生 View Transition / 并行整页副本 / morph | 未作为路由动画基础 | 不拍摄或缩放整篇长文章，不强行匹配 Canvas 标签词、头像或多行标题，也不创建离开的正文副本 |

官方入口（Astro 集成仅作对照，本主题不使用）：[Astro 集成](https://swup.js.org/integrations/astro/)、[Astro 集成源码与手动初始化说明](https://github.com/swup/astro)、[主题预设](https://swup.js.org/themes/)、[JSPlugin](https://swup.js.org/plugins/js-plugin/)、[配置](https://swup.js.org/options/)。

## 动效对象：内容舞台与引导区

动效不再只作用于标题。每个页面自行提名一个**内容舞台**（`[data-stalux-motion-stage]`：文章列、归档列表、标签卡片、友链列表、说说列表、首页内容块）。没有提名时，才测量最大的 `[data-stalux-motion-content]`；`[data-swup-persist]` 子树（文章三栏外壳）永不参与。标题块单独标 `[data-stalux-motion-region]`，只在舞台无法位移时承担位移。

两个约束决定了这套结构：

1. **舞台不许被无谓层化。** 给元素加 `transform` 会让它成为独立合成层，层尺寸等于元素完整外框。一篇 28000px 的文章列在 2560px 宽窗口上是约 78MB 纹理，而且要在换页关键路径上光栅化。因此舞台高度超过 **2 倍视口**时只做 `opacity` 交叉淡入，位移改由高度受 `min(480px, 视口高×0.6)` 限制的引导区承担。这个判断来自 `isOversizedStage()` 的实测高度，不靠页面类型假设。
2. **两段必须首尾相接。** 退场填充效果保留到入场第一帧，`releaseOutgoing` 在入场动画的同一个同步块里释放；分数帧不得把新文档先完整显示一次再跳回 0。

### 一次导航的两半

| 阶段 | 在哪执行 | 作用对象 | 说明 |
| --- | --- | --- | --- |
| 退场 | `content:insert`（ParallelPlugin 把新容器插到旧容器之前） | 被固定定位的旧容器 | 旧内容在原地淡出，`fill: forwards`，这层遮罩让读者看不到已经插入的新内容 |
| 入场 | `content:replace` 返回后、`content:scroll` 之前 | 新页舞台（+ 超限时的引导区） | `opacity 0 → 1`；位移只给能安全层化的节点 |
| 结算 | JSPlugin `in`、`visit:end`、`abort`、`fail` | 同一次 visit 的 gate | 四条路径都释放填充与遮罩，不留半透明文档 |

### 实测参数表（桌面；手机位移 ×0.6、时长 ×0.9）

| 场景 / 策略 | 入场 | 退场 |
| --- | --- | --- |
| 文章 → 文章 `article` | opacity 0→1，180ms，引导区 Y4px→0 | opacity 1→0，150ms（无位移） |
| 明确上一篇 / 下一篇 `previous`/`next` | opacity 0→1，150ms，引导区 X∓6px→0 | 130ms |
| 列表/首页 → 文章 `enter` | opacity 0→1，170ms，Y56px→0（舞台 ≤2 视口时位移在舞台上，否则在引导区） | 150ms |
| 回首页 `home` | 160ms，Y48px→0 | 140ms |
| 文章 → 归档/标签索引 `up` | 150ms，Y-44px→0 | 130ms |
| 标签/分类互跳 `taxonomy` | 140ms，X36px→0 | 130ms |
| 关于/友链/说说 `panel` | 150ms，Y44px→0 | 130ms |
| 普通跨页 `glide` | 140ms，Y40px→0 | 120ms |
| 历史前进后退 `restore` | 不播放入场（桌面与手机一致） | 不播放 |
| 404 `error` | 130ms 纯淡入 | 110ms |
| reduce / 隐藏标签页 / 原生手势 / 同 URL / hash | 立即可读，不播放 | 不播放 |

入场统一 `cubic-bezier(0.22, 1, 0.36, 1)`（强 ease-out：快速到位、柔和收尾），退场统一 `cubic-bezier(0.4, 0, 1, 1)`（ease-in：离场加速）。只动 `opacity` 与 `transform`，不动 `filter`、`box-shadow`、`height`。

策略仍由 [route-motion-policy.ts](../src/utils/route-motion-policy.ts) 按 from/to/导航类型选择；[route-motion.ts](../src/scripts/route-motion.ts) 只负责入场实现，[route-out.ts](../src/scripts/route-out.ts) 只负责退场实现。三者不合并，因为策略要能被单测穷举，动效要能被浏览器验收。

完整55种模块的设计、实现映射和减动画策略见 [MOTION.md](MOTION.md)。

首页、归档、文章、分类/标签索引及详情、关于、友链、说说和 404 统一进入这张策略表。桌面标签 Canvas 的词不参与共享元素 morph，手机标签卡片也不逐项 stagger。

**未实现：卡片封面 → 文章头图的共享元素 morph。** 它需要列表卡片与文章头图共用 `view-transition-name`，而 `document.startViewTransition()` 会对整个文档做快照：文章页一次快照就是数万像素高。局部使用需要把 morph 收敛到两个元素的独立快照层，收益是转场观感、成本是长文章首帧的不可控耗时，因此本版只做了 4.1/4.2 的基础版，shader/几何匹配留待单独的预算与测量。

同 URL 点击保持当前阅读位置；同页 hash 使用锚点滚动，不换 main、不重播页面入场，也不重新选择背景。前进/返回与普通“返回列表”链接不同：前者恢复历史条目的位置，后者仍是新的导航。换页前 `glideToTop()` 把旧文档滚回顶部（80–140ms 二次缓出，上限收到 140ms，因为读者对“页面自己滚动”的容忍度低于动画）；`hasUAVisualTransition` 已存在时不再叠加。

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
| `content:scroll` | 常规进入滚到顶部/目标锚点；历史恢复对应条目的位置与链接焦点；内容舞台在替换后的同一同步块里开始入场 | 不额外伪造导航 |
| `page:view` | 新模块已注册，挂载计数、评论、目录、标签云等当前 DOM 行为 | `astro:page-load` |
| JSPlugin `in` | 等待同一个已启动的内容动效完成；慢模块不会让已显示的内容延后跳动 | 共享 `ready` / `finished` gate |
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

发布验收在真实 myblog 的独立副本中进行：`npm pack` 出实体主题包 → `file:` 依赖安装（不使用源码软链）→ 生产构建 → `astro preview`。**不使用 dev 服务器验收**，dev 只用于编辑。真实 myblog 升级发生在副本验证通过之后。此文不把历史 1.41.0 的测量数据算作 Swup 实现的结果。

### 1.59.0 实测（Chromium 157，`astro preview`，桌面 1280×720）

| 验收项 | 实测 |
| --- | --- |
| 软导航 | `header`/`footer` 节点身份不变，`performance.getEntriesByType("navigation").length` 始终 1，`main` 始终 1 个 |
| 文章 → 文章 | 136 帧采样，`main` 文本长度最小 1252（无空帧），侧栏节点身份不变，舞台 opacity 时间线 1.00 → 0.00@143ms → 0.44@222ms → 1.00@321ms |
| 列表 → 文章 | 引导区 `translateY` 实测 56 → 34 → 19 → 10 → 5 → 2 → 0（170ms），舞台只做 opacity |
| 文章 → 归档 | 引导区 `translateY` 实测 -44 → -25 → -12 → -6 → -3 → -1 → 0（150ms），舞台只做 opacity |
| 快速连点 | 90ms 间隔点 4 篇，最终 URL 等于第 4 个目标；`.is-next-container`/`.is-previous-container` 残留 0 |
| 后退两次 | URL 与 `document.title` 逐条对应（/about → /tags → /archives） |
| Waline | 两次进入同一篇文章，`#waline-container` 恒为 1，`.wl-*` 节点 39 个不翻倍 |
| 统计去重 | 连续软导航 5 次，GA `page_view` 从 1 → 6，增量恰好 5，`page_path` 与 5 个目标一一对应 |
| 减少动态 | 运行时替换 `matchMedia` 后导航：`document.getAnimations()` 最大 0，舞台 opacity 1 且无内联样式残留，`staluxMotionPending` 未出现 |
| 样式不泄漏 | 连续 17 次导航，`head` 内 `style`+`link[rel=stylesheet]` 起始 6、结束 6（区间 5–8，按页面模块上下浮动，不随导航次数增长） |

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
