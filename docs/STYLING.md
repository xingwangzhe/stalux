# Stalux 样式维护（UnoCSS）

保留经典首页、文章三栏、极繁背景、透明面板、运行时 accentColor 和原有交互。主题包预编译 CSS，消费项目不必安装 UnoCSS。不引入 reset。共享样式默认输出为可缓存外部 CSS，尊重显式 `build.inlineStylesheets: "always"`。归档、分类、标签、短句和正文/数学通过使用它们的组件导入，不进入首页共享包。

生成样式首先声明 `theme, base, components, utilities` 的层顺序，避免基础 ul/p 规则覆盖组件的间距与颜色。

## 维护位置

| 位置 | 职责 |
| --- | --- |
| `uno.config.ts` | Wind3 utilities、共享 shortcuts、玻璃/光晕/阴影规则、扫描范围、CSS layers |
| `src/styles/shortcuts.ts` | 组件基础类；模板继续使用简短的 `stalux-` 类名，精确值使用 UnoCSS arbitrary properties |
| `src/styles/theme.css` | 主入口；基础层、组件层、正文的加载顺序 |
| `src/styles/theme/*.css` | 子元素、hover/focus、响应式、复杂状态规则；通过 `@apply` 组合 utilities 和共享 shortcuts |
| `src/styles/theme/prose.css` | 专用 Markdown 排版；在组件规则后加载，保留原来的级联顺序 |
| `src/styles/theme/base.css` | 全局基础行为及主题 CSS variables；不是 UnoCSS reset |
| `src/styles/base/math.css`、`src/styles/shared/*.css` | 数学字体、必要动效及 View Transitions |
| `src/styles/components/posts/waline.css` | 第三方评论适配，独立预编译后懒加载 |

简单局部样式可直接写 utility；重复布局优先使用 `stalux-flex-center`、`stalux-flex-row`、`stalux-stack`、`stalux-list-reset`。组件只保留自己的差异。颜色和配置值继续走现有 CSS variables，不构造动态 utility 名称。

## Astro 与 npm 两种模式

源码项目使用官方 `@unocss/astro`，默认 reset 关闭。`injectEntry: false` 避免与已经预编译的主题 CSS 重复注入；插件仍支持 Astro 内的 directives 转换。开发脚本同时监听源码与配置，将 utilities/shortcuts 和复杂 CSS 编译成按组件分组的产物。

`bun run styles:build` 使用已有 Vite 与 `unocss/vite` 编译 `generated.css`、`generated-{archives,article,categories,links,tags,words,prose}.css` 和 `generated-waline.css`。输出内容不变时不重写文件，保留增量缓存。构建、validate 与打包前强制编译；npm 包包含所有生成样式，由 `stalux()` 注入。消费方的覆盖组件新增 utilities 需由其自己的 UnoCSS 工具链编译。

`bun run dev` 同时运行样式监听与 Astro。监听排除生成文件，串行编译并合并连续变化，避免自触发循环。不要直接编辑 generated 文件。

## 保留原生 CSS 的理由

媒体查询断点、嵌套状态与子元素、目录高亮、keyframes、正文和数学排版、PhotoSwipe/Waline 覆盖、浏览器专用属性及 reduced-motion 保留精确 CSS，避免为了缩短字数改变行为。Shortcuts 负责基础组合，不取代这些规则。

维护量应同时计算 CSS、shortcuts、配置和模板表达；`@apply` 或 shortcuts 中的重复 token 仍属于样式维护量。源码行数减少不代表浏览器 CSS 或 HTML 一定减少，验收报告需要分别测量。

生成 CSS 的内容哈希进入共享运行时缓存指纹。样式变化会失效路由缓存，避免恢复引用旧 CSS 哈希的 HTML；相同输出与相同内容的重新写入不会改变指纹。
