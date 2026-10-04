# Stalux 样式维护（UnoCSS）

经典首页、极繁背景和运行时 accentColor 保持原有行为；文章使用正文优先的响应式布局。消费项目使用主题预编译的 CSS，不需要 UnoCSS，也不注入 Preflight/reset。

## 维护位置

| 位置 | 用途 |
| --- | --- |
| `uno.config.ts` | Wind3、主题 token 映射、共享能力及层级顺序 |
| `src/styles/shortcuts.ts` | 按功能明确归属的组件差异与短类名；共享基础类与组件类组合使用 |
| `src/styles/rules/*.ts` | 按功能组织的限定选择器、伪元素、状态与响应式规则 |
| `src/styles/features.ts` | common/article/archives/categories/links/tags/words 和原生 prose/waline 输出清单 |
| `src/styles/rule-utils.ts` | 将 utilities 与差异声明编译为 UnoCSS selector rules；控制媒体查询顺序 |
| `src/styles/base.css` | 基础行为、字体栈与运行时 CSS variables |
| `src/styles/motion.css` | keyframes、交错动画、View Transitions |
| `src/styles/content.css` | Markdown 后代排版规则 |
| `src/styles/math.css` | 数学字体、MathML 与浏览器差异 |
| `src/styles/integrations.css` | Waline 适配与其动画 |

保留八个 CSS 导入入口与所有 `generated*.css` 文件名。入口转发至预编译产物，直接导入公开路径同样有效；构建清单单独读取原生规则文件，避免生成文件循环导入。不要手工编辑生成文件。

## 选择规则

简单、局部样式直接使用 utilities。重复组件布局使用 `stalux-u-*` 基础类，和 `stalux-*` 组件差异组合。基础类输出到 components layer，因此更窄断点的组件规则仍能覆盖它们。新增组件必须明确写入 `shortcutsByFeature`，不得靠名称前缀猜测归属。

复杂状态使用 `StyleSpec`：选择器、无 variant 的 utilities、差异声明、可选媒体/支持查询。 utilities 未识别时构建失败。使用限定选择器保留目录高亮、导航开关、第三方 DOM 状态；不将原 CSS 文本搬进 TypeScript 字符串。

媒体查询采用明确顺序：较宽 max-width 在前、较窄在后，reduced-motion 和打印规则靠后。不要依赖 UnoCSS 对自定义 wrapper 的字母排序。必要 fallback、不同 specificity 和有意的层级覆盖不视为冗余。

正文、数学排版、第三方覆盖和 View Transition 伪元素保留原生 CSS。不要使用默认 Typography 外观替换主题正文。复杂结构继续通过容器控制，避免向 Markdown 或第三方 HTML 追加大量类名。

## 编译与消费

源码开发使用 `@unocss/astro` 且 `injectEntry: false`；`scripts/build-styles.ts` 使用现有 Vite/UnoCSS 编译主题。common 扫描组件、布局、页面、脚本并排除其他功能 shortcuts，各功能使用明确的 shortcuts 与状态规则清单。跨功能共享能力进入 common，其余由使用该功能的组件导入；prose/math 和 Waline 独立生成。

构建、validate、打包前运行 `bun run styles:build`。默认外部 CSS 可缓存，尊重消费者显式设置的 `inlineStylesheets: "always"`。消费者自编的 utility 由自己的工具链处理，原有组件覆盖接口保持兼容。

输出内容不变时不重写文件。watch 排除生成文件并串行合并变化；生成 CSS 内容哈希进入运行时缓存指纹，样式修改会使旧路由产物失效，相同内容不会失效。

## 衡量精简

同时报告原生 CSS、自定义 rules、shortcuts、配置、模板 class 与内联 style 的维护表达量。将 CSS 搬进 TypeScript 不算消除规则；注释/空行减少也不是声明去重。

统计整个构建目录和每条路由实际加载 CSS 的 raw/gzip/Brotli 体积，另报 HTML class 增长。以相同内容、视口和缓存条件进行 Chrome Stable 测量；减少文件数不等于减少传输，实验室结果不能宣称真实用户性能已经改善。

官方资料：[Shortcuts](https://unocss.dev/config/shortcuts)、[Rules](https://unocss.dev/config/rules)、[Layers](https://unocss.dev/config/layers)、[Directives](https://unocss.dev/transformers/directives)、[内容提取](https://unocss.dev/guide/extracting)、[Astro 集成](https://unocss.dev/integrations/astro)。

## Hover 与响应式验收清单

### 设计规则

采用轻反馈与稳定命中区域。文章卡片与标签命中区域静止，分类卡片及友链文字在稳定容器内部上浮最多 2px；头像仅在头像容器 hover 时单次旋转 650ms；目录与正文保持位置不变。触屏不依赖 hover，键盘有可见焦点，减少动态效果时禁用装饰动画。

文章正文最大 1200px；1600px 以下单栏；1600px 起两侧栏各 200px，间距 24px，整体最大 1696px。正文取消重复 padding，宽代码、表格、公式与 Mermaid 在局部滚动。

### 源码 hover 清单

| 源文件 | 选择器或规则 | 处理 |
| --- | --- | --- |
| `src/styles/base.css` | `a:not(.a-none):not([data-stalux-card]):not(.stalux-nav-link):hover::after {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/base.css` | `a:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/base.css` | `::-webkit-scrollbar-thumb:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/content.css` | `.stalux-prose a:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/content.css` | `.stalux-prose tr:hover td {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/content.css` | `.stalux-prose img:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/content.css` | `.stalux-prose details:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/integrations.css` | `.wl-btn:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/integrations.css` | `.wl-btn.primary:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/integrations.css` | `.wl-card:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/integrations.css` | `.wl-nick:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/integrations.css` | `.wl-reply:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/integrations.css` | `.wl-emoji-popup button:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/integrations.css` | `.wl-reaction-item:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/integrations.css` | `.wl-reaction-item:hover .wl-reaction-img img {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/integrations.css` | `.wl-sort li:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/integrations.css` | `.wl-page button:hover:not(:disabled) {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/integrations.css` | `.wl-power a:hover {` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/article.ts` | `[".stalux-random-refresh:hover", "", { color: "var(--accent-60p, #0066cc)" }],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/article.ts` | `[".stalux-random-list > li > a:hover", "", { background: "var(--white-05p)" }],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/article.ts` | `[".stalux-toc-item:hover", "", { background: "var(--white-05p)" }],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/article.ts` | `[".stalux-post-taxonomy-item-column:hover", "", { background: "var(--white-05p)" }],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/article.ts` | `[".stalux-post-taxonomy-item-pill:hover", "", { background: "var(--white-05p)" }],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/article.ts` | `"a.stalux-pagination-link:is(:hover, :focus-visible)",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/article.ts` | `"a.stalux-pagination-prev-post:is(:hover, :focus-visible) .stalux-pagination-arrow",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/article.ts` | `"a.stalux-pagination-next-post:is(:hover, :focus-visible) .stalux-pagination-arrow",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/article.ts` | `".stalux-post-source-link:hover, .stalux-post-source-link:focus, .stalux-post-source-link:active",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/article.ts` | `".stalux-license-box a:hover",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/article.ts` | `[".stalux-license-box:hover .stalux-license-watermark", "opacity-[0.25]", {}],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/categories.ts` | `".stalux-category-shell:hover .stalux-category-card",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/categories.ts` | `".stalux-category-shell:hover .stalux-category-card::before",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/categories.ts` | `".stalux-category-shell:hover .stalux-category-card .stalux-category-icon",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `".stalux-card-post-tags a:hover .stalux-card-post-tag",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `".stalux-card-post-categories a:hover .stalux-card-post-category",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `".stalux-post-card-shell:hover .stalux-post-card .stalux-card-post-cover img",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `".stalux-post-card-shell:hover .stalux-post-card",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `[".stalux-nav-scroll-btn:hover", "", { background: "transparent" }],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `[".stalux-nav-container:hover .stalux-nav-scroll-btn[data-visible]", "opacity-[1]", {}],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `".stalux-nav-link:hover .nav-icon, .stalux-nav-link:hover .stalux-nav-text",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `".stalux-author-figure > a:hover img",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `".stalux-404-home-btn:hover",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `[".stalux-theme-info a:hover", "no-underline", { color: "rgba(255, 255, 255, 1)" }],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `[".stalux-beian-beian-info a:hover", "no-underline", { color: "rgba(255, 255, 255, 0.9)" }],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `".stalux-beian-public-security-beian:hover",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/common.ts` | `[".stalux-badge-group-summary:hover", "text-ink-70", {}],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/links.ts` | `".stalux-link-shell:hover .stalux-link-card",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/links.ts` | `".stalux-link-card-avatar:hover img",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/links.ts` | `".stalux-link-card-avatar:hover img",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/tags.ts` | `".stalux-cloud-tag-card:hover",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/tags.ts` | `[".stalux-cloud-tag-card:hover::before", "", { transform: "translateX(100%)" }],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/tags.ts` | `[".stalux-tag-header .stalux-tag-back-link:hover", "", { color: "var(--accent-90p)" }],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/words.ts` | `".stalux-word-card:hover",` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |
| `src/styles/rules/words.ts` | `[".stalux-word-source-link:hover", "", { color: "var(--accent-90p)" }],` | 精细指针 hover；保留静态焦点反馈；边界停留验收 |

### 发布门禁

每项检查中心、四边、四角、连续进出及静止停留；容器位置与尺寸不得反复变化，页面不得出现横向滚动。全路由在窄屏与宽屏检查，代表页面覆盖全部目标尺寸、键盘、触屏、减少动态效果及软导航。

版本发布同时要求主题 validate、包内容检查、实体消费者副本连续两次构建、Agent 静态摘要与视觉隐藏检查。

### 构建期图片处理

图片尺寸与加载策略使用 parse5 的真实元素及源码位置，仅替换实际 img 标签。不得对完整 HTML 用正则搜索 img：代码复制按钮的 data-code 和脚本字符串也可能包含图片示例，误改会破坏属性、复制内容和页面布局。源码区间替换保留其余 HTML 原文，图片加载策略覆盖正文嵌套 section。

## 生产名称转换

`styles:build` 先编译 CSS，再生成 `src/internal/style-names.generated.ts`。映射由主题源码决定，不扫描消费项目内容；同一版本实体安装和模板模式一致。不要手改生成映射。开发时使用原名，生产通过 `compact-styles` 的提前 transform 钩子在 Astro 编译之前转换。不要对最终 dist 资源直接改名，否则会破坏资源哈希、脚本选择器和增量路由引用。

新动态名称必须通过 `productionStyleName()` 解析，或改成稳定的 `data-*` 行为钩子。HTML 模板字符串只转换真实样式属性，CSS 经语法树转换；`data-ref` 值不能作为 class 重命名。不要增加 `[class*="..."]` 等依赖名称片段的规则，卡片链接使用 `data-stalux-card`。映射、转换器和 CSS targets 进入 runtime cache key，防止恢复引用旧资源的页面。

自有样式优先使用标准规则；MDN 明确弃用的 `clip` 已由 `clip-path` 替代，旧 `word-break: break-word` / `word-wrap` 被 `overflow-wrap` 替代，颜色使用现代 RGB。仍依赖特定引擎的多行截断和第三方 MathML 适配须在对应浏览器验证，不能直接删除。第三方 class / variables 及公开字体变量不压缩。

指纹检查记录公开 webappanalyzer 规则来源、获取日期和 SHA-256；实际 Wappalyzer CLI 扫描需另记录版本。生产 sourcemap 关闭，文章正文和代码示例不得清理。发布前执行完整 validate、包内容检查、独立消费者连续构建和浏览器软导航验收。
