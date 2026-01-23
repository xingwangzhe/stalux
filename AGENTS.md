# AGENTS.md - CSS 编写规范（2026 年版）

**目标**：写出**现代、性能好、可维护、浏览器支持率 ≥ 95%** 的 CSS 代码。  
**当前基准时间**：2026 年 1 月  
**核心原则**：优先使用 2021 年以后成熟的新特性，**坚决避免** 已经被新特性取代的旧写法。

## 必须优先使用的现代特性（2023–2026 年已广泛支持）

| 优先级 | 特性                          | 最低浏览器版本（大致）          | 必须替换掉的旧写法                          | 推荐写法示例                              |
|--------|-------------------------------|----------------------------------|---------------------------------------------|--------------------------------------------|
| ★★★★★  | CSS 原生嵌套                  | Chrome 120+, Safari 17.2+, FF 117+ | Sass/Less 嵌套、PostCSS nesting             | `.card { &--active { ... } }` 或直接嵌套   |
| ★★★★★  | `:has()` 关系选择器           | 2024 年底全覆盖                  | JS 加 class、复杂的后代选择器               | `article:has(> img) { ... }`               |
| ★★★★★  | 容器查询 `@container` + cqi/cqw/cqh | Chrome/FF/Safari 2023–2024 全支持 | 媒体查询 + 硬编码断点                       | `@container (min-width: 400px) { ... }`    |
| ★★★★★  | 相对颜色语法 + `oklch()`      | 2024–2025 全覆盖                 | 手动计算 hsl 亮度、大量变量                 | `color: oklch(from var(--c) 75% c h);`     |
| ★★★★★  | `light-dark()` 函数           | 2025 年普及                      | `prefers-color-scheme` 媒体查询重复写两套   | `color: light-dark(#000, #fff);`           |
| ★★★★   | `aspect-ratio`                | 2021 年起全覆盖                  | padding-bottom hack                         | `aspect-ratio: 4 / 3;`                     |
| ★★★★   | `text-wrap: balance` / `pretty` | 2023+                           | 手动加 `<wbr>` 或 JS 平衡                   | `text-wrap: balance;`                      |
| ★★★★   | 数学函数 `round()` `mod()` `sin()` `cos()` 等 | 2023–2025 | 复杂 calc() 嵌套、大量 --var 计算           | `transform: rotate(calc(360deg * round(var(--i) / 5)));` |
| ★★★    | `@property` 注册自定义属性    | Chrome 85+ / 其他 2023+          | 无类型 --var 导致动画不平滑                 | `@property --hue { syntax: "<angle>"; ... }` |
| ★★★    | `subgrid`                     | 2024 年较好支持                  | 重复定义相同网格轨道                        | `grid-template: subgrid;`                  |
| ★★     | `@starting-style`             | 2024–2025                        | 首次渲染闪现（FOUC）问题                    | `@starting-style { opacity: 0; }`          |
| ★★     | `transition-behavior: allow-discrete` | 2024+                   | `display: none → block` 无法 transition     | `transition: display 0.3s allow-discrete;` |

## 严格禁止使用的过时 / 低效写法（2026 年已无必要）

- **禁止** 使用媒体查询（`@media`）做组件级响应式 → 改用 `@container`
- **禁止** 使用 `float` 布局 → 用 flex / grid
- **禁止** 使用 `padding-bottom` hack 维持宽高比 → 用 `aspect-ratio`
- **禁止** 使用 `position: absolute` + 大量 JS 计算做卡片跟随/锚点定位 → 等 `anchor()` 稳定后用
- **禁止** 写 `calc(var(--a) + var(--b) * 1px)` 这种无类型的变量运算 → 用 `@property` 注册类型
- **禁止** 手动写两套颜色方案（`--light-xxx` / `--dark-xxx`） → 用 `light-dark()` 或相对颜色
- **禁止** 使用 `!important` 除非万不得已（99% 情况可以用 `:has()` / 更高特异性 / 层级解决）
- **禁止** 使用 `.class > * + *` 这种万能选择器间距技巧 → 用 `gap` + flex/grid
- **禁止** 写死的 `max-width: 1200px` 居中容器 → 用 `margin-inline: auto; max-width: min(90vw, 80rem);` 等现代写法
- **禁止** 使用 `currentColor` 以外的颜色继承 hack → 优先用相对颜色

## 推荐的现代 CSS 编写风格偏好（2026）

```css
/* 好的现代写法示例 */
.component {
  --_hue: 210;
  --_size: 1rem;

  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--_size);

  container-type: inline-size;

  color: light-dark(black, white);
  background: oklch(98% 0.02 200);

  & h2 {
    text-wrap: balance;
    font-size: clamp(1.4rem, 5cqi, 2.2rem);
  }

  @container (min-width: 30rem) {
    grid-template-columns: 1fr 2fr;
  }

  @starting-style {
    opacity: 0;
    translate: 0 20px;
  }

  transition: opacity 0.4s ease, translate 0.6s ease-out;
}