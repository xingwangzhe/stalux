# Markdown 正文 CSS 重新设计

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重新设计博客文章正文的 Markdown CSS，实现美观、可读性强、字体适中的排版效果。

**Architecture:** 整合现有的两份重叠样式文件（`markdown.css` 和 `postContent.module.css`）中关于正文内容的规则，统一到 `markdown.css` 中，消除冲突与冗余。`postContent.module.css` 只保留布局容器类（`.articleContent`、`.body`、标题区、页脚等），所有内容排版交由 `markdown.css` 管理。引入中英文皆宜的字体系统与精细化排版。

**Tech Stack:** CSS Custom Properties（已存在的 tokens 系统）、纯 CSS（无预处理器）、Astro CSS 模块

---

## 现状分析

### 问题一：双重样式冲突

| 元素       | `markdown.css` 的规则                | `postContent.module.css` 的规则                                              | 冲突表现                   |
| ---------- | ------------------------------------ | ---------------------------------------------------------------------------- | -------------------------- |
| h1         | 2.5rem/700, margin-top 2rem          | 2rem, border-bottom accent                                                   | 打字尺不一致，底部边框丢失 |
| h2         | 2rem/600, margin-top 2.5rem          | 1.6rem, border-bottom accent                                                 | 同理                       |
| p          | line-height 1.7, mb 1.5rem           | margin 1rem 0, line-height 1.8, color white-80p                              | 行高和边距互相覆盖         |
| img        | max-width 100%, margin 1rem auto     | border-radius 8px, shadow-lg, hover scale                                    | 效果叠加但定义零散         |
| blockquote | border-left accent-60p, bg white-05p | border-left accent-60p, bg black-10p, font-style italic, border-radius 0 8px | 样式差异大                 |

### 问题二：缺少字体系统

- 正文没有 `font-family` 定义，完全依赖浏览器默认字体
- 中文字体渲染效果不可控（Linux 下默认无中文字体）
- 代码字体使用回退 `"Courier New", monospace`，现代感不足

### 问题三：CSS 变量使用不一致

- 部分属性使用 `--space-*` 变量，部分硬编码数值
- `markdown.css` 中硬编码了 `.01a2be` 作为 accent 后备色，实际应该用 `--accent-*` 变量

### 问题四：排版细节可优化

- 标题底部边框在 h1/h2 上效果不错，但 h3-h6 没有，层级感不够
- 表格样式偏基础，缺少 hover 行高亮
- 列表项间距可优化
- 代码块与 Expressive Code 的集成边界模糊

---

## 设计方案

### 1. 字体系统

```
--font-body: "LXGW WenKai", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif
--font-mono: "JetBrains Mono", "Fira Code", "Consolas", monospace
```

- 正文：中文字体优先的混合栈，兼顾中英文混排
- 代码：现代等宽字体栈
- 在 `init.css` 中添加字体变量定义

### 2. 排版层级

| 层级 | 字号    | 字重 | 行高 | 底部边框             | 顶部外边距 |
| ---- | ------- | ---- | ---- | -------------------- | ---------- |
| h1   | 2.4rem  | 700  | 1.25 | 3px solid accent-50p | 2.5rem     |
| h2   | 1.8rem  | 650  | 1.3  | 2px solid accent-30p | 2.5rem     |
| h3   | 1.4rem  | 600  | 1.4  | -                    | 2rem       |
| h4   | 1.15rem | 600  | 1.45 | -                    | 1.5rem     |
| h5   | 1rem    | 600  | 1.5  | -                    | 1.5rem     |
| h6   | 0.9rem  | 600  | 1.5  | -                    | 1.5rem     |
| 正文 | 1rem    | 400  | 1.75 | -                    | -          |

### 3. 颜色系统

- **正文**：`--white-85p`（略亮于当前 80p，提升可读性）
- **h1-h3**：`--white-full`（全亮）
- **h4-h6**：`--white-90p`
- **strong**：`--accent-90p`（强调色高亮）
- **inline code**：粉色系保持，但使用变量化
- **blockquote**：左侧 accent 边框，背景微妙，font-style 保留
- **table**：header 使用 accent 色，行交替色 stripe

### 4. 间距系统

统一使用 `--space-*` tokens：

- 段落间距：`--space-lg` (1.5rem)
- 块级元素（pre, blockquote, table）间距：`--space-xl` (2rem)
- 标题下边距：`--space-md` (1rem)
- 列表项间距：0.4rem

### 5. 具体元素强化

- **表格**：添加 `overflow: hidden` + `border-radius`，hover 行高亮，更清晰的边框
- **引用块**：两个 `p` 之间的间距优化，支持多段落
- **图片**：保留圆角 + 阴影 + hover 缩放，加入 `object-fit` 保护
- **链接**：统一使用 `border-bottom` 样式（与全局 a::after 不冲突），hover 颜色过渡
- **代码块**：保留左侧 accent 边框 + 阴影，与 Expressive Code 和谐共存
- **脚注区**：精简样式，与正文区分
- **分割线**：使用 1.5px 粗细，带微妙渐变

---

## Task 分解

### Task 1: 添加字体变量到设计系统

**Files:**

- Modify: `src/styles/base/init.css` (在 `:root` 中添加字体变量)

- [ ] **Step 1: 在 `:root` 中添加字体变量**

在 `init.css` 的 `:root` 中、`--font-size-tiny: 0.8rem;` 之后添加：

```css
/* 字体族栈 */
--font-body:
    "LXGW WenKai", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, -apple-system,
    sans-serif;
--font-body-serif: "Noto Serif SC", "Source Han Serif SC", "STSong", Georgia, serif;
--font-mono: "JetBrains Mono", "Fira Code", "Consolas", "Courier New", monospace;
```

- [ ] **Step 2: 应用字体到正文**

在 `init.css` 中（在 `html, body` 规则内或附近）添加：

```css
body {
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 3: 验证**

检查页面 body 字体是否应用成功。

- [ ] **Step 4: 提交**

```bash
git add src/styles/base/init.css
git commit -m "feat: 添加字体系统变量到设计系统"
```

---

### Task 2: 重写 `markdown.css`——统一正文排版

**Files:**

- Rewrite: `src/styles/components/markdown.css` (完全重写)

- [ ] **Step 1: 完整重写 `markdown.css`**

将所有规则集中在 `[data-pagefind-body]` 范围内，覆盖所有 Markdown 元素。

内容见下一任务——实际编写时一并完成。

- [ ] **Step 2: 验证基本渲染**

预览一篇博客文章，检查标题、段落、链接是否按预期渲染。

- [ ] **Step 3: 提交**

```bash
git add src/styles/components/markdown.css
git commit -m "feat: 重写 markdown.css，统一正文排版样式"
```

---

### Task 3: 清理 `postContent.module.css` 中的重复样式

**Files:**

- Modify: `src/styles/components/posts/postContent.module.css` (删除与 markdown.css 重叠的内容样式)

- [ ] **Step 1: 删除 `:global(.articleContent :where(h1, h2, h3, h4, h5, h6))` 块**（第 131~166 行）

保留 `.articleContent` 布局样式（flex、padding、background、border-radius），但删除所有 `:global(.articleContent ...)` 中属于**正文内容排版**的规则，包括：

- 所有 heading 的 `:global()` 规则
- `:global(.articleContent p)` 规则
- `:global(.articleContent a)` 规则（链接动画由全局 `a::after` 处理）
- `:global(.articleContent code)` 和 `:global(.articleContent pre)` 规则
- `:global(.articleContent blockquote)` 规则
- `:global(.articleContent ul)`、`:global(.articleContent ol)`、`:global(.articleContent li)` 规则
- `:global(.articleContent table)`、`:global(.articleContent th)`、`:global(.articleContent td)`、`:global(.articleContent tr:hover)` 规则
- `:global(.articleContent img)` 规则
- `:global(.articleContent hr)` 规则
- `:global(.articleContent strong)` 规则
- `:global(.articleContent em)` 规则

**保留**的内容模块专属样式：

- `.articleContent` 布局类（flex 列、背景、内边距、圆角、阴影）
- `.body` 类（宽度约束 `min(900px, 100%)`、居中）
- `.articleHeader` 及其子元素（标题、元数据）
- `.articleFooter` 及其子元素
- `.pageStats` 阅读量统计
- 响应式断点中仅涉及容器/布局的部分
- `@keyframes fadeInUp` 动画

- [ ] **Step 2: 更新响应式断点**——删除其中关于内容的 `:global()` 规则，只保留布局相关

- [ ] **Step 3: 验证无样式损失**

对比修改前后的文章页面，确保所有元素样式正常。

- [ ] **Step 4: 提交**

```bash
git add src/styles/components/posts/postContent.module.css
git commit -m "refactor: 清理 postContent.module.css 中与 markdown.css 重叠的内容样式"
```

---

### Task 4: 微调与验证

- [ ] **Step 1: 检查各种 Markdown 元素**
    - 标题层级 (h1-h6)
    - 段落与换行
    - 内联代码和代码块
    - 表格
    - 引用块（含多段落）
    - 列表（含嵌套）
    - 图片
    - 链接
    - 分割线
    - 脚注
    - strong/em/del/kbd/mark
    - details/summary
    - figure/figcaption

- [ ] **Step 2: 检查响应式行为**（1024px, 768px 断点）

- [ ] **Step 3: 最终视觉审查**

读一篇完整文章，对比旧样式的截图，确认所有改进有效。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "style: 完善 Markdown 正文排版细节"
```

---

## 完整的 `markdown.css` 设计稿

```css
/* Markdown 内容渲染样式 */
/* 作用于 postContent 的 body 区域 ([data-pagefind-body]) */
/* 2026-06-24 重新设计 — 统一中英文排版，优化可读性 */

/* ---------- 基础排版 ---------- */

[data-pagefind-body] {
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.75;
    color: var(--white-85p);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
}

/* ---------- 标题系统 ---------- */

[data-pagefind-body] h1,
[data-pagefind-body] h2,
[data-pagefind-body] h3,
[data-pagefind-body] h4,
[data-pagefind-body] h5,
[data-pagefind-body] h6 {
    color: var(--white-full);
    font-weight: 600;
    line-height: 1.3;
    margin-top: var(--space-xl);
    margin-bottom: var(--space-md);
}

[data-pagefind-body] h1 {
    font-size: 2.4rem;
    font-weight: 700;
    line-height: 1.25;
    margin-top: 2.5rem;
    margin-bottom: var(--space-lg);
    border-bottom: 3px solid var(--accent-50p);
    padding-bottom: 0.6rem;
}

[data-pagefind-body] h2 {
    font-size: 1.8rem;
    font-weight: 650;
    line-height: 1.3;
    margin-top: 2.5rem;
    margin-bottom: var(--space-md);
    border-bottom: 2px solid var(--accent-30p);
    padding-bottom: 0.4rem;
}

[data-pagefind-body] h3 {
    font-size: 1.4rem;
    font-weight: 600;
    line-height: 1.4;
    margin-top: 2rem;
    margin-bottom: var(--space-md);
    color: var(--white-95p);
}

[data-pagefind-body] h4 {
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.45;
    margin-top: 1.5rem;
    margin-bottom: 0.6rem;
    color: var(--white-90p);
}

[data-pagefind-body] h5 {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.5;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--white-90p);
}

[data-pagefind-body] h6 {
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.5;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--white-80p);
}

/* ---------- 段落 ---------- */

[data-pagefind-body] p {
    margin: 0 0 var(--space-lg);
    line-height: 1.75;
}

/* ---------- 文本强调 ---------- */

[data-pagefind-body] strong {
    font-weight: 600;
    color: var(--accent-90p);
}

[data-pagefind-body] em {
    font-style: italic;
    color: var(--white-85p);
}

[data-pagefind-body] strong em,
[data-pagefind-body] em strong {
    color: var(--accent-90p);
}

[data-pagefind-body] del {
    color: var(--white-60p);
}

[data-pagefind-body] mark {
    background-color: rgba(255, 217, 102, 0.25);
    color: inherit;
    padding: 0.1em 0.2em;
    border-radius: 2px;
}

[data-pagefind-body] kbd {
    font-family: var(--font-mono);
    font-size: 0.85em;
    background-color: var(--white-10p);
    border: 1px solid var(--white-20p);
    border-radius: 4px;
    padding: 0.15em 0.4em;
    color: var(--white-85p);
}

[data-pagefind-body] sup,
[data-pagefind-body] sub {
    font-size: 0.8em;
}

/* ---------- 链接 ---------- */

[data-pagefind-body] a {
    color: var(--accent-80p);
    text-decoration: none;
    border-bottom: 2px solid transparent;
    transition:
        color var(--transition-fast) ease,
        border-bottom-color var(--transition-fast) ease;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
}

[data-pagefind-body] a:hover,
[data-pagefind-body] a:focus-visible {
    color: var(--accent-90p);
    border-bottom-color: var(--accent-60p);
}

/* 确保 footer 等区域的全局面链接不被覆盖 */
/* (a::after 由 init.css 中的全局 a 规则处理，仅在非 markdown 区域生效) */

/* ---------- 内联代码 ---------- */

[data-pagefind-body] code {
    font-family: var(--font-mono);
    font-size: 0.88em;
    color: #ff92d0;
    background-color: rgba(255, 121, 198, 0.15);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    border: 1px solid rgba(255, 121, 198, 0.25);
}

/* ---------- 代码块 ---------- */

[data-pagefind-body] pre {
    background: var(--black-30p);
    color: var(--white-85p);
    padding: 1.2rem 1.5rem;
    border-radius: 8px;
    border-left: 4px solid var(--accent-60p);
    margin: var(--space-xl) 0;
    overflow-x: auto;
    font-size: 0.92em;
    line-height: 1.65;
    font-family: var(--font-mono);
    box-shadow: var(--shadow-md);
}

[data-pagefind-body] pre code {
    background: none;
    color: inherit;
    padding: 0;
    border: none;
    font-size: inherit;
    font-family: inherit;
}

/* Expressive Code 如果包裹了 pre，让 EC 管理样式 */
.expressive-code pre,
.expressive-code code {
    all: revert;
}

/* ---------- 列表 ---------- */

[data-pagefind-body] ul,
[data-pagefind-body] ol {
    margin: 0 0 var(--space-lg);
    padding-left: 1.75rem;
}

[data-pagefind-body] li {
    margin: 0.4rem 0;
    line-height: 1.75;
    color: var(--white-85p);
}

[data-pagefind-body] ul li {
    list-style: disc;
}

[data-pagefind-body] ul li ul li {
    list-style: circle;
}

[data-pagefind-body] ul li ul li ul li {
    list-style: square;
}

[data-pagefind-body] ol li {
    list-style: decimal;
}

[data-pagefind-body] ol li ol li {
    list-style: lower-alpha;
}

[data-pagefind-body] li > ul,
[data-pagefind-body] li > ol {
    margin-top: 0.3rem;
    margin-bottom: 0.3rem;
}

/* ---------- 引用块 ---------- */

[data-pagefind-body] blockquote {
    margin: var(--space-xl) 0;
    padding: 1rem 1.5rem;
    border-left: 4px solid var(--accent-60p);
    background: var(--black-10p);
    border-radius: 0 8px 8px 0;
    color: var(--white-75p);
    font-style: italic;
}

[data-pagefind-body] blockquote p {
    margin: 0;
    line-height: 1.7;
}

[data-pagefind-body] blockquote p + p {
    margin-top: 0.8rem;
}

[data-pagefind-body] blockquote strong {
    color: var(--accent-85p);
}

[data-pagefind-body] blockquote code {
    font-size: 0.85em;
}

/* 引用块中的引用署名 (--- 作者) */
[data-pagefind-body] blockquote p:last-child em {
    display: block;
    text-align: right;
    color: var(--white-60p);
    font-size: 0.9em;
    margin-top: 0.5rem;
}

/* ---------- 表格 ---------- */

[data-pagefind-body] table {
    width: 100%;
    border-collapse: collapse;
    margin: var(--space-xl) 0;
    box-shadow: var(--shadow-md);
    border-radius: 8px;
    overflow: hidden;
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

[data-pagefind-body] th,
[data-pagefind-body] td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--white-10p);
    line-height: 1.6;
}

[data-pagefind-body] th {
    background: var(--accent-30p);
    color: var(--white-full);
    font-weight: 600;
    font-size: 0.95em;
    white-space: nowrap;
}

[data-pagefind-body] td {
    color: var(--white-85p);
}

[data-pagefind-body] tr:nth-child(even) td {
    background-color: var(--white-05p);
}

[data-pagefind-body] tr:hover td {
    background-color: var(--black-10p);
}

[data-pagefind-body] table code {
    font-size: 0.85em;
}

/* ---------- 图片 ---------- */

[data-pagefind-body] img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: var(--space-xl) auto;
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    transition:
        transform var(--transition-normal) ease,
        box-shadow var(--transition-normal) ease;
}

[data-pagefind-body] img:hover {
    transform: scale(1.02);
    box-shadow: var(--shadow-xl);
}

/* ---------- 媒体（视频、iframe、embed） ---------- */

[data-pagefind-body] iframe,
[data-pagefind-body] embed,
[data-pagefind-body] video {
    max-width: 100%;
    height: auto;
    display: block;
    margin: var(--space-xl) auto;
    border-radius: 8px;
}

/* ---------- 水平分隔线 ---------- */

[data-pagefind-body] hr {
    margin: var(--space-2xl) 0;
    border: none;
    height: 1.5px;
    background: linear-gradient(
        90deg,
        transparent,
        var(--white-15p) 20%,
        var(--accent-40p) 50%,
        var(--white-15p) 80%,
        transparent
    );
}

/* ---------- 详情/摘要折叠 ---------- */

[data-pagefind-body] details {
    margin: var(--space-lg) 0;
    padding: 0.8rem 1rem;
    background-color: var(--white-05p);
    border: 1px solid var(--white-10p);
    border-radius: 6px;
    transition: border-color var(--transition-fast) ease;
}

[data-pagefind-body] details:hover {
    border-color: var(--white-20p);
}

[data-pagefind-body] summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--white-90p);
}

[data-pagefind-body] details[open] summary {
    margin-bottom: 0.8rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid var(--white-10p);
}

/* ---------- 图片和人物介绍 ---------- */

[data-pagefind-body] figure {
    margin: var(--space-xl) 0;
    text-align: center;
}

[data-pagefind-body] figcaption {
    font-size: 0.9em;
    color: var(--white-70p);
    margin-top: 0.5rem;
    font-style: italic;
}

/* ---------- 脚注 ---------- */

[data-pagefind-body] .footnotes {
    font-size: 0.88em;
    color: var(--white-75p);
    border-top: 1px solid var(--white-15p);
    margin-top: var(--space-2xl);
    padding-top: var(--space-lg);
}

[data-pagefind-body] .footnotes ol {
    margin-left: 1rem;
    padding-left: 0.5rem;
}

[data-pagefind-body] .footnotes li {
    margin: 0.5rem 0;
    line-height: 1.6;
}

[data-pagefind-body] .footnotes a {
    font-size: 0.9em;
}

/* ---------- Responsive 调整 ---------- */

@media (max-width: 1024px) {
    [data-pagefind-body] {
        font-size: 0.95rem;
    }

    [data-pagefind-body] h1 {
        font-size: 2rem;
    }

    [data-pagefind-body] h2 {
        font-size: 1.6rem;
    }

    [data-pagefind-body] h3 {
        font-size: 1.25rem;
    }

    [data-pagefind-body] h4 {
        font-size: 1.05rem;
    }

    [data-pagefind-body] pre {
        font-size: 0.88em;
        padding: 1rem 1.2rem;
    }
}

@media (max-width: 768px) {
    [data-pagefind-body] {
        font-size: 0.9rem;
        line-height: 1.7;
    }

    [data-pagefind-body] h1 {
        font-size: 1.6rem;
        margin-top: 1.5rem;
    }

    [data-pagefind-body] h2 {
        font-size: 1.3rem;
        margin-top: 1.5rem;
    }

    [data-pagefind-body] h3 {
        font-size: 1.1rem;
        margin-top: 1.25rem;
    }

    [data-pagefind-body] h4 {
        font-size: 1rem;
        margin-top: 1rem;
    }

    [data-pagefind-body] h5 {
        font-size: 0.9rem;
    }

    [data-pagefind-body] h6 {
        font-size: 0.85rem;
    }

    [data-pagefind-body] p {
        margin-bottom: var(--space-md);
    }

    [data-pagefind-body] pre {
        font-size: 0.82em;
        padding: 0.8rem 1rem;
        margin: var(--space-lg) 0;
        border-left-width: 3px;
    }

    [data-pagefind-body] table {
        font-size: 0.85rem;
    }

    [data-pagefind-body] th,
    [data-pagefind-body] td {
        padding: 0.5rem 0.7rem;
    }

    [data-pagefind-body] blockquote {
        padding: 0.8rem 1rem;
        font-size: 0.9em;
    }

    [data-pagefind-body] ul,
    [data-pagefind-body] ol {
        padding-left: 1.5rem;
    }
}
```

---

## 自我审查

**1. 需求覆盖度：**

- ✅ 美观的正文排版 —— 完整的字体系统、层级比例、间距系统
- ✅ 字体适中 —— 中英文字体栈、响应式字号调整
- ✅ 暗色主题 —— 使用已有 accent 和 white/black 变量
- ✅ 消除冲突 —— 将内容样式集中在 markdown.css，postContent.module.css 只保留布局

**2. 占位符检查：** 无占位符，所有代码完整

**3. 类型一致性：** 使用与现有系统一致的 CSS 变量名，所有选择器保持 `[data-pagefind-body]` 范围
