# 全面重构计划（staluxmyblog 先行，验证后同步 stalux）

## 阶段 0：基线

- 确认 staluxmyblog 当前 git 干净（search 修复已提交）。
- 先跑一次 `bun run build` 作为对照基线。

## 阶段 1：运行时泄漏 & 复杂度（高价值、低风险）

- `search.astro`：把 `keydown`/`openSearch`/`click` 监听器移出 `astro:page-load`（改模块顶层或一次性 init 守卫），避免视图切换累加；删掉从未使用的 `highlighter`，循环外只建一个可复用 `Highlight` 实例。
- `date.astro` 与 `FooterStats.astro`：`setInterval` 的 id 存模块级，在 `astro:before-swap` 里 `clearInterval`，保证全局只有 1 个定时器。
- `archivesList.astro` / `tags/[tag].astro` / `categories/[category].astro`：每个 post 只 `toTimestamp` 一次并缓存为数字，比较器/内层循环改纯数字比较；archivesList 用 `Object.entries` 去掉 `Number()` 强转。

## 阶段 2：抽取共享模块（去重，中风险，需逐文件验证）

- 新建 `src/utils/search-schema.ts`：导出 `searchSchema` 与 `SearchDoc` 类型，消灭 search.astro / search-index.json.ts 里 3 份重复的索引结构定义。
- 新建 `src/utils/feed.ts`：抽 `buildFeed({ updatedTag })` 工厂，`rss.xml.ts` 与 `atom.xml.ts` 共用。
- 新建 `src/utils/taxonomy.ts`：抽泛型 `buildTaxonomyStaticPaths(...)`，`tags/[tag].astro` 与 `categories/[category].astro` 共用。
- `collections-stats.ts`：抽 `countBy(posts, keyFn)` 泛型，两个统计函数复用，避免重复 `getCollection("posts")`。
- `feature-flags.ts`：抽 `flushWordCount(ctx)` 合并 heading/paragraph 重复 handler；合并 `formatReadingTime`/`getReadingMinutes` 为 `ceilMinutes`。
- `postTags.astro` / `postCategories.astro`：合并为参数化 `PostTaxonomy`（`kind: "tag"|"category"`），删掉组件内重复的 `@keyframes fadeScale`（统一用全局 `animations.css`）。
- `WalineComment.astro`：清理重复字段罗列，直接把 `walineConfig` 对象传给 `init()`；about.astro 与 PostLayout.astro 那 13 行 `as any` Waline 块统一为强类型中间对象。
- 过薄包装：`countWords` / `langToFeedLanguage` / `toMachineDateTime` 视情况内联或改名。

## 阶段 3：ESnext 语法糖 + 注释 + 风格统一（低风险、覆盖面广）

- `??` 替代误用的 `||`（posts/[post].astro、postContent.astro 等数值/字符串默认值）。
- 统一 `(await getCollection("config"))[0]?.data ?? {}` 兜底（38 处无保护 → 与已有 3 处一致）。
- 整理 import 顺序（index.astro、textType.astro、author.astro）；`@ts-ignore` → `@ts-expect-error` 或正确类型。
- 关键逻辑补中文注释：feature-flags（Sätteri 状态传递）、WalineComment（base64 可逆编码非加密）、background.ts（SSR/VT 状态机）、word-count-utils（rendered 取值路径）、toc-scrollspy（兜底循环）。
- 删死代码：postContent.astro 的 `true &&`、analytics 里冗余 `configCollection` 变量、head.astro 写死 title 等。
- 核实 `word-count-utils.ts:64` 的 `isZh ? "万" : "0k"` —— `"0k"` 疑似笔误，确认单位策略后修正。

## 阶段 4：验证 & 同步

- 每完成一大阶段跑 `bun run build` + `oxlint`/`oxfmt` 确认不破。
- staluxmyblog 全绿后，把相同改动同步到 `stalux`，再各自构建验证。
- 改动分阶段 commit（不自动 push，等你确认）；构建若有回归立即回退该阶段。

## 说明

- CommonJS 经调研确认项目已是纯 ESM，无需改动。
- 全程中文注释、保守改动、以构建绿灯为底线。
