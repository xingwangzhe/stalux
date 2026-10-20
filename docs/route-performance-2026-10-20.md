# 100 ms 路由过渡与性能归因（2026-10-20）

## 实现与选择依据

本轮候选为 Stalux 1.39.1。Astro 7.4 的 ClientRouter 本来就调用 `document.startViewTransition()`，其路由封装还负责脚本执行、history、焦点、滚动和持久节点。仅把同一个 Document API 换一个调用位置不会自动减少浏览器的样式与捕获成本。主题继续使用 Astro 路由，通过浏览器原生 `Element.animate()` 对新正文执行一次 `opacity: 0.7 → 1`、`100ms ease-out` 动画。

html、main 与持久节点均取消 View Transition 的命名捕获；实际浏览器检查其 `view-transition-name` 均为 `none`、native 伪元素动画为 0。Astro 仍调用原生 Document 过渡，不能据此声称浏览器内部所有准备工作都消失。新的共享 lifecycle 同时跟踪原生交换与主题实际动画，背景、路由进度和状态清理等待对应的完成信号，快速取消会使旧动画与异步回调失效。减少动态效果时直接跳过，原生 View Transition API 不可用时保留 Astro swap 与同一正文动画；浏览器自身已有历史导航动画时避免再叠加主题动画。

100 ms 是声明的动画时长，不是完整路由时长保证。请求 HTML、准备代码 CSS 与字体、替换 DOM、浏览器重算样式与布局，都会发生在内容可见之前。后台 SDK 的长任务也可能使实际帧或完成回调晚于声明的 100 ms。

依据：[MDN View Transition API](https://developer.mozilla.org/zh-CN/docs/Web/API/View_Transition_API)、[ViewTransition 生命周期](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition)、[Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)、[Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/)。没有采用实验性的 `Element.startViewTransition` 或 `ViewTransition.waitUntil`，也没有替换 Astro 的 DOM swap。

## 成本分解

| 来源 | 本轮观察 | 已采用的处理 |
| --- | --- | --- |
| 多层快照与动画 | 旧产物同时存在 root、main 等原生动画；只缩短某一项不能消除其余捕获与完成等待 | 去除整页和持久节点的快照，正文单次 100 ms WAAPI |
| 顶栏同步几何读取 | scroll / resize / mount 中的读取和 CSS 变量写入曾交错，持久 header 的根变量删除后还需重建 | rAF 批量先读后写，纵向滚动不重复读取宽度，保留持久 header 已测量的根变量；独立最小高度解决跨断点反馈 |
| 新 DOM 的样式与布局 | 三次最终包 CPU profile 都在 BackToTop 首次 `scrollY` 读取处触发昂贵同步 flush；原生 Layout / UpdateLayoutTree 嵌在该栈内 | 保留归因，不把 sampled self 当作可全部消除的 JavaScript 工作；双 rAF 延后候选总时间更慢且按钮状态失败，未采用 |
| Google `page_view` | SDK 已加载时 `dataLayer.push` 会同步执行事件处理和 DOM 检测 | 捕获逐页 URL / title / referrer FIFO，等待共享内容 ready 与两次 rAF 后在独立后台优先任务发出；不关统计 |
| Clarity | 远程核心仍有真实 DOM 采集成本；三次 heavy incoming 采样仅约 1.1–1.4 ms，ready 之后仍有 SDK 工作 | 使用官方 `@microsoft/clarity@1.0.2` 单次初始化与加载复用；不把 npm 包当 Worker，也不声称总 CPU 消失 |
| HTML / 代码 CSS / 字体 | 热导航实验中资源等待不足以解释部分秒级长尾；冷访仍必须准备关键样式和字体 | 保留 CSS hoist、逐页字体及有界字体 loader；分别验收冷首屏与热软导航 |

带 trace 的诊断执行会增加开销；其中 390–942 ms 的 BackToTop sampled self 包含原生样式和布局，不与相同阶段的 Layout / UpdateLayoutTree 相加，也不作正式性能收益。对根属性定制 diff、1 ms 动画、官方 fade / slide、`skipTransition()` 等候选也进行了独立实验；没有实测稳定收益或存在正确性问题的方案不进入发布包。

## 动画机制的独立对照

先用同一消费产物筛选 Astro 官方 fade / slide、缩短原生动画、空捕获加正文 WAAPI 与强制 fallback。官方 fade 实际两个动画，slide 实际四个；低样本和首尾漂移没有支持直接改成 slide。仅把原生动画设为 1 ms，长文章的 before-swap → ready 仍约 499 ms，说明还有新画面准备成本。

随后对两个候选都使用 100 ms，在 390×844、CPU 4× 的手机条件下，按 viewport 命名捕获 → 原生空捕获加正文 WAAPI → 原生空捕获加正文 WAAPI → viewport 命名捕获的 ABBA 顺序确认。两者都保留 Astro ClientRouter、官方 DOM swap 与 `document.startViewTransition()`：A 将 html 命名为 `stalux-page`、main 不单独捕获，保留 header/footer 的独立命名捕获，关闭 group 几何动画，viewport 的 old 淡出与 new 淡入各 100 ms，并使用 `plus-lighter` 混合；B 将全部元素 name 设为 `none`，新 main 使用单次 100 ms `Element.animate()`，没有禁用原生 API，也没有调用 `skipTransition()`。这不是旧版默认 root/main 多层动画与新版的整包比较。

每个变体的首页、代码文、长文章各 20 次，归档 60 次；合计 240 正式样本与 24 次预热，均保留真实统计。本轮使用此前的同一实体候选和原生 Clarity loader，用于机制确认，不能冒充下文最终 npm 集成整包验收。

| 路线 | viewport 命名捕获 + 原生交叉淡入 median | 原生空捕获 + 正文 WAAPI median | 变化 |
| --- | ---: | ---: | ---: |
| 首页 | 640 ms | 563 ms | -12.1% |
| 归档 | 812 ms | 729 ms | -10.2% |
| 代码文章 | 977 ms | 823 ms | -15.7% |
| 长文章 | 1108 ms | 1012 ms | -8.7% |

`oldCapture` 是调用原生 API 到 before-swap 的阶段代理，包含旧画面准备，不能全称为像素复制 CPU。其代码文中位数从 78.8 到 40.7 ms、长文章从 78.7 到 44.3 ms、归档从 61.7 到 26.6 ms。长文章的 before-swap → ready 反而从 479.3 到 527.6 ms；这一阶段还包含 DOM swap、新样式与布局，空捕获没有消除这些工作。B 的全部正式样本在 ready 时真实正文动画 currentTime 均为 0，没有靠准备期间提前播放完动画获得结果。

这一机制对照的尾部没有稳定改善：首页 p95 从 721 到 946 ms，长文章从 1428 到 1933 ms；两半也有漂移，第一半首页与归档略慢、第二半明显更快，新画面 style / layout 与 SDK 长任务仍可能形成长尾。选择单次正文动画还基于不移动背景与持久壳层、减少快照表面，以及完整取消 / fallback 生命周期。下文最终整包的 p95 改善包含顶栏与统计调度等其他修复，不将两场结果混称为纯动画收益。

## 正式消费验收

以下比较真实 myblog 的 1.39.0 与最终 1.39.1 实体包。桌面为 1440×900、CPU 1×，手机为 390×844、CPU 4×；系统 Chrome 155.0.8059.84、Node 26.12.0、performance 电源模式。使用 Astro preview，本机 HTML / CSS / 字体无人工网络限速，远程统计走既有系统代理并绕过 localhost，所有真实功能保留。每端先排除一轮预热，正式样本使用热字体和资源；不代表冷网首访或线上 CDN 条件。

单位 ms，`median / p95` 使用 nearest rank。每条主路线 20 次，每端归档为四条返回路线合计 80 次；每端共 160 次连续真实正式导航，另有 8 次预热。旧版与新版不是同时运行，且修改包含快照、顶栏与统计调度，整版收益不能全部归因于某一个 API。

| 设备 | 路线 | 旧版 median / p95 | 新版 median / p95 | median 变化 |
| --- | --- | ---: | ---: | ---: |
| 桌面 | 首页 | 624.2 / 741.9 | 274.5 / 323.3 | -56.0% |
| 桌面 | 归档 | 720.5 / 916.8 | 317.2 / 392.3 | -56.0% |
| 桌面 | 代码文章 | 784.2 / 935.3 | 395.0 / 501.7 | -49.6% |
| 桌面 | 长文章 | 840.4 / 1004.8 | 442.4 / 488.5 | -47.4% |
| 桌面 | 图片文章 | 771.1 / 931.7 | 361.2 / 465.4 | -53.2% |
| 手机 | 首页 | 881.5 / 1085.6 | 569.2 / 753.1 | -35.4% |
| 手机 | 归档 | 1203.2 / 1419.1 | 655.8 / 1130.7 | -45.5% |
| 手机 | 代码文章 | 1401.8 / 1771.3 | 882.1 / 1397.5 | -37.1% |
| 手机 | 长文章 | 1737.3 / 2433.9 | 1033.3 / 1596.2 | -40.5% |
| 手机 | 图片文章 | 1116.7 / 1757.3 | 672.6 / 1090.4 | -39.8% |

主组两端实际动画 320/320，ready 拒绝 0、应用异常 0；远程 Clarity `null.sequence` 桌面 4 次、手机 3 次，完整 stack 单列。旧 mobile 基线有 4 条同名错误但没有 stack，保持未分类，不根据新版 stack 倒推旧错误来源。

其余五条导航在各端另开 context，每条 20 次；独立返回归档共 100 次，不混入上表的 80 次归档。下表仅是最终版绝对值，没有旧版的同组成基线。

| 次组路线 | 桌面 median / p95 | 手机 median / p95 |
| --- | ---: | ---: |
| 标签 | 325.5 / 523.8 | 595.8 / 817.6 |
| 分类 | 331.6 / 380.7 | 509.2 / 755.4 |
| 友链 | 311.8 / 381.7 | 591.2 / 731.4 |
| 关于 | 311.3 / 401.6 | 644.6 / 746.7 |
| 留言 | 313.8 / 474.4 | 587.0 / 729.5 |
| 本组返回归档 | 372.2 / 520.4 | 671.0 / 1101.2 |

主次组共 720 次正式真实导航、36 次预热。次组页面异常 0、ready 拒绝 0；所有正式导航都观察到真实 100 ms 动画完成。requestfailed 主组桌面 / 手机为 169 / 173，次组为 213 / 211，主要包括 Google collect 的 abort；正式性能采样未逐个关联所有响应，不能据这些条数推断丢包。另一次专门业务验收按 Request 关联 61 个 Google 请求均先有 204 后有 abort，详情见遥测报告。

| 验收 | 当前证据 |
| --- | --- |
| 独立 myblog 副本 | 配置、真实内容与 public 不修改；生产主题包实体复制，不使用软链接 |
| 两次生产构建 | 均 731 HTML、731 逐页字体引用、Pagefind 249 页，sitemap / 404 / agent summary 正常；第二次 1440 restored |
| dev 功能 | 桌面 / 手机的代码、字体 fallback、真实搜索与结果导航、首次灯箱、Waline、history、快速导航通过 |
| dev 动画与缩放 | 桌面 / 手机 × native / reduced / fallback 共 18 跳，13 组 header 状态与三轮断点切换通过 |
| production 业务 | 两端真实文章、LXGW 页面字体与本地代码字体、head 代码 CSS、搜索、灯箱、评论、history、快速路由通过，应用与 SDK pageerror 0 |
| production 动画与缩放 | header 13 组状态、三轮缩放与六次真实导航通过；两端六种 motion 组合共 18 跳通过，12 个自有 100 ms 动画均完成，reduced 无动画，历史滚动精确恢复 |
| 旧会话升级 | revision 3 → 4 恰好一次整页刷新，随后恢复软导航，单一进度条且无页面异常 |

production motion 的 desktop/native 另记录一次远程 Clarity 0.8.72-beta `null.sequence`，栈指向托管核心，应用异常 0；其他五组无 pageerror。这里没有将第三方异常从原始记录中删除。部分 Google 请求在响应后伴随 abort，网络失败与 SDK / 应用错误分别记录，不能把请求失败条数直接当成丢失浏览量。

正式路由表统一使用 `max(原生与自有动画完成, ready后双rAF, page-load) - before-preparation`。双 rAF 只是内容得到绘制机会的代理，不是逐像素可见性证明。原始旧版数据派生到同一完成边界，旧文件保持原样；不能声称两个采集器的所有实现完全相同。Lighthouse TBT 不作为真实 INP。

统计 Worker 的准确性、60 次连续导航对照及官方 npm 集成边界另见 [统计与 Worker 验证](./telemetry-workers-2026-10-20.md)。

## 首屏 Lighthouse 与保留限制

新旧版首页均各测桌面 / 手机三次，12 轮全部首次尝试完成，runtimeError / warnings 均为空。两端使用相同 150 ms RTT、1638.4 Kbps 模拟网络，各轮独立 Chrome profile，真实统计不屏蔽。

| 设备 | 旧版三次 Performance | 新版三次 Performance | TBT median 旧 → 新 | LCP median 旧 → 新 |
| --- | --- | --- | ---: | ---: |
| 桌面 | 80 / 83 / 82 | 82 / 82 / 82 | 17 → 11.5 ms | 2007 → 1999 ms |
| 手机 | 98 / 95 / 94 | 82 / 76 / 85 | 219.5 → 656.5 ms | 1987 → 2004 ms |

手机首屏 TBT 出现明显回退，不能宣称首屏整体提升。首轮 bootup 归因的 Google CPU 为旧 198、新 887 ms，Google SDK 更早进入阻塞窗口；同时手机 benchmarkIndex 旧约 1773–1806、新 1115–1464，真实远程响应时间也有明显差异。尚未完成隔离实验，不能将回退全部归因于 Clarity npm 或某一处调度代码；后续应验证初始 Google page_view 入队时序与环境漂移。

全部 12 轮 Google container、Clarity tag / core 和 Umami 脚本均实际完成 HTTP 200；部分 collect 在采集窗口结束时仍未完成，GA 另有 204 后 abort，均保留，不能将其写成全部统计入库成功。没有通过关闭统计或重跑挑分掩盖回退。用户要求立即发布当前版本，因此本版保留这一已知限制，未临时加入未经验证的首屏修复。TBT 不作为真实 INP。

未强制 GC 的两个端点中，主题 lifecycle 注册集合稳定，但 DOM、监听器及部分 heap 有增长；本轮不能证明无内存泄漏或整体内存改善。
