# 1.59.0 路由层：硬接入 swup 4.x 与过渡动效

日期：2026-11-14。基线提交 `eab13bb1`，合并结果 `newMain`。本文记录本轮改了什么、动效参数、九项验收的实测数据，以及**放弃的优化**。设计契约见 [../view-transitions-swup.md](../view-transitions-swup.md)。

## 一、改了什么

| 文件 | 改动 |
| --- | --- |
| `src/scripts/route-motion.ts` | 入场参数表重写：每个 preset 有独立的 `duration` / `exit` / `nudge`；新增 `isOversizedStage()`、`getRouteRegion()`、`offsetTransform()`；入场统一 `cubic-bezier(0.22, 1, 0.36, 1)`；舞台超过 2 视口时只做 opacity，位移改由有界标题块承担；一处 preset 可同时驱动两个动画（舞台淡入 + 标题位移），`finished` 以最长的那个为准 |
| `src/scripts/route-out.ts` | 退场从"写死 160ms / -12px"改为按同一张策略表驱动（方向、时长、缓动与入场同源）；抽出 `playStageExit(preset, signal, target)`，路由器可以把退场作用在**被固定的旧容器**上，非并行路径仍用 `animateRouteOut` |
| `src/scripts/swup-router.ts` | `content:insert` 的容器退场改用 `playStageExit`，删掉 `translateY(-12px)` 与 `ease-out` 的硬编码。动效策略仍在 `route-motion-policy.ts`，没有回写路由器 |
| `src/utils/seo-document.ts` | JSON-LD 作者 `url` 与分类面包屑改用 `toPublicUrl()`：**页面路由不带尾斜杠**，与 canonical / sitemap / feed / og:url 对齐 |
| `src/utils/ai-discovery.ts` | llms.txt / `*.md` 导出里的 `URL:` 与分类标签链接改用 `toPublicUrl()`，同一原因 |
| `src/scripts/smooth-scroll.ts` | 换页回顶上限 180ms → **140ms** |
| `tests/*` | 动效、退场、SEO、生命周期四组断言按新参数更新；新增「结构化数据里除站点根以外不得出现尾斜杠 URL」回归用例 |

没有改动：脚本每会话一次执行、Waline 的 dispose、统计去重、过期 visit 中止（`visit.abort()`）、样式剪枝、fragment + 并行容器组合、`ignoreVisit` 清单、`edgeone.json`、URL 结构。

## 二、动效参数表（实现值）

| preset | 入场 | 退场 | 位移落点 |
| --- | --- | --- | --- |
| `article`（文章→文章） | opacity 0→1，**180ms** | **150ms**，无位移 | 标题块 4px |
| `previous` / `next` | **150ms** | 130ms | 标题块 ∓6px（横向） |
| `enter`（列表/首页→文章） | **170ms**，56px | 150ms | 舞台 ≤2 视口时在舞台上，否则标题块 |
| `home` | 160ms，48px | 140ms | 同上 |
| `up`（文章→归档/标签索引） | 150ms，-44px | 130ms | 同上 |
| `taxonomy`（标签/分类互跳） | 140ms，36px 横向 | 130ms | 同上 |
| `panel`（关于/友链/说说） | 150ms，44px | 130ms | 同上 |
| `glide` | 140ms，40px | 120ms | 同上 |
| `restore`（历史前进后退） | 不播放 | 不播放 | — |
| `error`（404） | 130ms 纯淡入 | 110ms | — |
| reduce / `document.hidden` / `hasUAVisualTransition` / 同 URL / hash | 不播放 | 不播放 | — |

- 入场缓动统一 `cubic-bezier(0.22, 1, 0.36, 1)`，退场统一 `cubic-bezier(0.4, 0, 1, 1)`。
- 手机：位移 ×0.6、时长 ×0.9。
- 只动 `opacity` / `transform`；不碰 `filter`、`box-shadow`、`height`。

### 实测（Chromium 157，`astro preview`）

| 采样 | 结果 |
| --- | --- |
| 文章→文章 退场动画真值 | `duration: 130`（`next` preset），`easing: cubic-bezier(0.4, 0, 1, 1)`，作用在 `ARTICLE` 容器上，`currentTime` 按 17/33/50/67/83/100/117ms 递进，opacity 1.00→0.16 |
| 文章→文章 入场 | opacity 0.00 → 0.44 → 0.72 → 0.87 → 0.94 → 0.98 → 0.99 → 1.00（约 180ms 的强 ease-out） |
| 列表→文章 位移 | 标题块 `translateY` 56 → 34 → 19 → 10 → 5 → 2 → 0，同一时间舞台 `translateY` 恒为 0 |
| 文章→归档 位移 | 标题块 `translateY` -44 → -25 → -12 → -6 → -3 → -1 → 0 |
| 合成层 | 15019px 与 28000px 的文章列只做 opacity，未产生 `transform` 层 |

## 三、九项验收实测

环境：`npm pack` → `file:` 依赖装进 `/tmp/myblog-swup`（真实 myblog 源码副本，753 页）→ `CODEBUDDY_SAFE_DELETE_ENABLED=0 bun run build` → `astro preview`（`localhost:4321`）。浏览器：Chrome 157 headless，CDP 驱动，1280×720。

| # | 项目 | 实测 |
| --- | --- | --- |
| 1 | 软导航 | `header`/`footer` 节点身份不变（`true`/`true`）；`performance.getEntriesByType("navigation").length` 始终 **1**；`document.querySelectorAll("main").length` 为 **1**；控制台错误 **0** |
| 2 | 文章之间 | `/posts/65110 → /posts/48826`：131 帧 rAF 采样，`main` 文本长度最小值 **1252**，**空帧 0**；三栏外壳 `[data-swup-persist]` 节点身份不变；舞台 opacity 完整走到 1.00；无残留容器 |
| 3 | 快速连点 | 90ms 间隔 4 次导航（前 3 次点击仍在 DOM 的锚点，第 4 次目标锚点已被换走，改用同一 visit 管线的 `swup.navigate`），最终 URL = **第 4 个目标** `/posts/appimage-mannger-native-linux`；`.is-next-container` **0**、`.is-previous-container` **0**；`main` 1 个 |
| 4 | 后退两次 | `/ → /archives → /tags → /about` 后 `history.back()` ×2：URL 与 `document.title` 依次回到 `/tags`、`/archives`，两条都对上；h1 = 「文章归档」 |
| 5 | Waline | 两次进入 `/posts/65110` 并滚到评论区：`#waline-container` 恒为 **1**，`#waline-comment` 恒为 **1**，`.wl-*` 节点两次都是 **39**（不翻倍） |
| 6 | 统计去重 | 连续软导航 5 次（`/archives`,`/tags`,`/about`,`/links`,`/words`）：GA `page_view` 由 **1 → 6**，增量 **5**；`page_path` 恰好是这 5 条 |
| 7 | reduced-motion | 运行时把 `prefers-reduced-motion` 置为 match 后导航：`document.getAnimations().length` 最大 **0**；舞台 opacity **1**、无内联样式残留；`data-stalux-motion-pending` 未出现；正文可读 |
| 8 | 样式不泄漏 | 连续 17 次导航：`<head>` 内 `style`+`link[rel=stylesheet]` 起始 **6**、结束 **6**，区间 5–8（随页面模块上下浮动，不随导航次数增长） |
| 9 | 门禁 | `bun run test:run` **78 文件 / 621 用例全绿**；`bun run check` 0 error；`bun run astro:check` **0 error / 0 warning / 0 hint**；`CODEBUDDY_SAFE_DELETE_ENABLED=0 bun run build` 通过（含 `verify-build`：43 HTML、39 字体、SEO 与 agent 输出） |

补充：全站产物扫描，`https://xingwangzhe.fun/<路径>/` 形式的绝对 URL 由 56 处降为 0；`rel="canonical"`、`og:url`、sitemap、RSS/Atom、JSON-LD、llms.txt 全部不带尾斜杠。

## 四、放弃或未做的优化

| 项 | 为什么不做 |
| --- | --- |
| 卡片封面 → 文章头图的共享元素 morph | 需要两端同名 `view-transition-name` 与 `document.startViewTransition()`；后者对**整个文档**做快照，文章页一次快照就是数万像素高。真正的局部 morph 要把两个元素拆进独立快照层，收益是观感、成本是长文章首帧不可控。本轮先把 4.1/4.2 的基础版做扎实，morph 留待单独预算与首帧测量 |
| 退场与入场重叠（消除交接处的空档） | Swup 的 `content:replace → content:scroll` 是顺序管线，退场填充只能在替换前结束。实测交接处约 1–2 帧（约 39ms）舞台处于 0 透明度，`main` 文本始终非空所以不是白屏。要完全重叠必须复制一份旧内容做叠化，那正是 1.41 时代被删掉的整页副本方案 |
| 并行 visit 下用 `glideToTop()` 播放"页面自己滚回顶部" | ParallelPlugin 在退场**之前**就把旧容器固定定位并裁剪成当前视口切片，此时滚动旧文档不会移动那块切片，反而会让切片位置与新文档错开。改为：换页瞬间把新文档 `scrollTo(0)`（`startsFresh`，实测落地 `scrollY=0`），旧切片原地淡出 |
| `native: true` 全局过渡 | 按约束禁止：长文章快照成本高，且会让 `prefers-reduced-motion` 之外的分支不可控 |
| 移动端真机验证 | 本轮只有 headless Chromium 与桌面视口；手机上的位移 ×0.6 / 时长 ×0.9 是按既有设计推算，未做真机手感验收。这条不算通过，需要后续在真机补测 |
| 把四段路由动效合并成一套 CSS 变量 | 保持 policy / motion / out 三层分离：策略要能被单测穷举，动效要能被浏览器采样。合并会让两者都变难验证 |
