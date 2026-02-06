---
title: "Astro: 优化katex,mermaid和灯箱使用"
abbrlink: 55667
date: 2026-02-06 18:13:00
categories:
  - 技术
tags:
  - stro
  - 性能优化
  - 前端
---

在前文[ Astro 5.17构建性能优化实践：从18s到13s](/posts/astro-517-performance-optimization/)中,我已经成功减少了构建时间,这次,通过继续优化 **`katex`**、**`mermaid`** 和 **灯箱** 的使用,我进一步提升了博客的 **客户端** 和 **构建时** 性能。

## 核心问题

传统的做法通常是在 Layout 中直接 `import` 对应的 CSS 文件，或者在 `astro.config.mjs` 中添加全局集成。这会导致在普通的页面,即使没有使用 `KaTeX`,`Mermaid`,`灯箱` 的文章，也会加载这些资源，造成 **不必要的性能开销**。

## 优化思路：构建时检测

我们利用 Astro 对 Markdown 处理的钩子（Remark 插件），在构建初期就 **“预知”** 文章的内容特征。

### 1. 增强内容检测插件

修改 `src/utils/remark-post-body.ts`，在遍历 Markdown 的 **抽象语法树（AST）** 时，通过 `unist-util-visit` 查找特定的节点：

```typescript title="src/utils/remark-post-body.ts"
// 伪代码示例
visit(tree, (node: any) => {
  if (node.type === "image") hasImage = true;
  if (node.type === "math") hasKatex = true;
  if (node.type === "code" && node.lang === "mermaid") {
    hasMermaid = true;
    // 将代码块转换为特定格式以便前端渲染
    node.type = "html";
    node.value = `<pre class="mermaid">${node.value}</pre>`;
  }
});
```

这些标识位会被自动注入到文章的 **`remarkPluginFrontmatter`** 中。

### 2. 布局层的条件渲染

在 `PostLayout.astro` 中，我们可以根据这些标识位，**动态引入** 样式组件和脚本。由于 `astro` 文件的 `frontmatter` 部分是 **构建时静态分析** `import`，为了实现动态注入，我们将样式进行了 **组件化包裹**，再通过组件引入放在 **条件渲染** 中：

```astro title="src/components/stalux/posts/KatexStyle.astro"
---
import "katex/dist/katex.min.css";
---
<!-- 无内容,只有frontmatter静态导入的css -->
```

<br/>

```astro title="src/components/stalux/posts/PhotoSwipeStyle.astro"
---
import "photoswipe/dist/photoswipe.css";
---
<!-- 无内容,只有frontmatter静态导入的css -->
```

<br/>

```astro title="src/layouts/PostLayout.astro"
---
// 仅在需要时引入组件
import KatexStyle from "@components/stalux/posts/KatexStyle.astro";
import PhotoSwipeStyle from "@components/stalux/posts/PhotoSwipeStyle.astro";
const { hasKatex, hasImage, hasMermaid } = Astro.props;
---

{hasKatex && <KatexStyle />}
{hasImage && <PhotoSwipeStyle />}

<!-- 页面内容 -->
<slot />

{hasMermaid && (
    <script>
        import mermaid from "mermaid";
        // 动态初始化逻辑...
    </script>
)}
```

## 带来的改变

| 维度           | 优化措施                                           | 最终效果                                   |
| :------------- | :------------------------------------------------- | :----------------------------------------- |
| **构建性能**   | 自动化检测与 **按需加载** `katex`,`mermaid`,`灯箱` | 整体流水线运行效率显著提升，构建速度更快   |
| **客户端体验** | 样式与脚本按需加载，适配 `astro:page-load`         | **页面首屏体积更小**，完美兼容视图转换动画 |

## 总结

之前还有很多优化,比如说 **减少 `render` 的重复使用**，在这里就不说了。总之最后通过优化，时间上从 **13s 减少到 11s**，客户端的性能也有了质的提升！
