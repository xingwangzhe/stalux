# 首访挂载时机修正（2026-10-25）

首访文章页评论不出现、页脚 Vercount 停在 `Loading...`，刷新一次就正常。原因是首屏挂载被绑在 `window.load` 上，而不是本页 DOM 就绪。

## 现象与复现

首发链接直达文章页（冷缓存），评论区整块空白、页脚 UV/PV 一直 `Loading...`；按 F5 后两者都正常。

生产产物上可稳定复现：用浏览器请求拦截把字体与图片按住不放，模拟首访遇上慢资源或卡死的第三方资源。

| 产物 | `document.readyState` | Vercount 脚本 | UV / PV | `.wl-editor` |
| --- | --- | --- | --- | --- |
| 修正前 | `interactive` | 0 个 | `Loading...` | false（滚动到评论区也不挂载） |
| 修正后 | `interactive` | 1 个 | 有值 | true，评论面板 1 份 |

刷新之所以"能好"，是因为字体与图片已进缓存，`load` 很快就到；一旦首发链接的某个子资源慢或挂死，首屏就永久停在空白。

## 根因

Astro 的 ClientRouter 在 **首次加载**时从 `window.load` 派发 `astro:page-load`（`node_modules/astro/dist/transitions/router.js`：初始化时 `addEventListener("load", onPageLoad)`，只有交换完成后才在 `updateCallbackDone` 里调用 `onPageLoad()`）。而 `window.load` 要等完文档里的每一个图片、字体、iframe 和第三方资源。

于是存在一个完整的危险窗口：文档已解析（`readyState === "interactive"`）、模块脚本已执行完，但 `astro:page-load` 还没来。旧 `src/scripts/page-runtime.ts` 的补偿微任务只判 `readyState === "complete"`，正好跳过这个窗口；而评论与统计都只监听 `astro:page-load`：

- `src/scripts/waline.ts`：`registerPageLifecycle` 只在 `astro:page-load` 时挂载，`IntersectionObserver` 也在挂载内创建，所以没挂载就永远不会懒加载。
- `src/scripts/analytics-runtime.ts`：`trackVercountPage()`（以及 GA / Umami 的逐页上报）同样挂在 `astro:page-load` 上。
- `src/scripts/background.ts`：首屏背景 `initializeBackground` 同样只等 `astro:page-load`。

这不是 Astro 的 bug，而是把"本页 DOM 就绪"错当成了"文档所有资源就绪"。Astro 的 `astro:page-load` 语义确实是"页面加载完成"，但它对首访的含义包含整页资源，不适合作为首屏交互的唯一挂载点。

## 修法

只改挂载时机，不改生命周期语义。

- `page-runtime.ts`：文档解析完成（`readyState` 为 `interactive` 或 `complete`）就用补偿微任务挂载当前页；`astro:page-load` 负责软导航后的新页面，以及同一页的重复信号。早挂载已经接管本页时，`page-load` 不再挂第二次——重复挂载会生成第二份观察器或第二个 Waline 实例。仍然保留原有约束：迟到的补偿微任务不能落到已被替换的 DOM 上（换页即作废），`astro:before-swap` 依旧先释放再等新页。仍用微任务而不是同步调用，避免在模块自身求值结束前执行 `mount()`（模块顶层的后置绑定可能还在 TDZ）。
- `analytics-runtime.ts`：首访同样在解析完成时派发一次；早派发接管本页，`window.load` 上的 `astro:page-load` 只当重复信号。Vercount 脚本、GA `page_view`、Umami 上报在一次访问里仍各只发一次，不会重复计数。`astro:before-swap` 会作废早派发，软导航照旧逐页上报。
- `background.ts`：首屏背景同样在解析完成时提交第一张，软导航仍等 `astro:page-load`。`initializeBackground` 顶部的"已有背景图"判断只能挡住解码完成之后的重复调用；早提交已发起、解码尚未落地时，迟到的 `page-load` 会被 `firstCommitStarted` 挡掉，否则同一页会解码并淡入第二张背景。

`readyState` 判断写成"等于 `interactive` 或 `complete`"，而不是"不等于 `loading`"：真实浏览器只有这三种状态，但单测里的替身对象没有 `readyState`，正写才不会让替身误判成"已解析"。

## 验证

- 单测 415 项全绿（新增 6 项）：解析完成即挂载、`DOMContentLoaded` 兜底、换页在早挂载执行前到达则不挂旧 DOM、早派发与 `page-load` 只上报一次、Google 只发一次 `page_view`、首访只提交一张背景。
- 背景那条去重测试做过反向验证：临时删掉 `firstCommitStarted` 守卫后，冷首访会解码 2 次、测试立刻失败；恢复后通过。
- `bun run check`、`bun run astro:check`（0 error / 0 warning）、`bun run knip` 均通过。
- 开发服务器与生产产物分别跑同一组浏览器检查：
  - 子资源卡死首访：评论挂载、统计出值，见上表。
  - 正常首访：评论面板 1 份、编辑器 1 份、Vercount 脚本 1 个。
  - 冷首访网络计数：`events.vercount.one/js` 与 `/api/v2/log` 各 1 次、Clarity 初始化 1 次，早派发没有把同一次访问重复上报。
  - 归档 → 文章软导航往返 3 次：每次都是 1 个面板、1 个编辑器、1 个容器、1 个统计脚本，无 `pageerror`。
- 生产构建 43 页通过。

复现与对照脚本、日志保存在工作区 `work/stalux-lifecycle-20261025/`（`evidence/`）。
