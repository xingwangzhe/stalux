---
title: Astro 5.17构建性能优化实践：从18s到13s
abbrlink: astro-517-performance-optimization
date: 2026-02-02 19:52:00
tags: [Astro, 性能优化, 前端, ssg]
categories: 技术
---

## 前言

在维护个人博客主题 [Stalux](https://github.com/xingwangzhe/stalux) 的过程中，随着文章数量增长到 150+ 篇，我发现构建时间逐渐变得非常的慢,对于调试来说很不方便(因为当前astro依赖的vite版本build和dev结果是不一样的)。每次 `astro build` 都要等待 **18 秒以上**，这不仅影响了开发体验，也让 CI/CD 流程变得拖沓。

本文将详细介绍如何通过 [Astro 5.17](https://astro.build/blog/astro-5170/) 引入的 `retainBody` 选项，配合自定义 Remark 插件，在构建阶段提前提取文章元数据，从而将构建时间从 **18s+ 优化到 13s+**。

---

`问题分析`：**为什么构建这么慢？**

### 原始方案的问题

在优化前，我的 `content.config.ts` 使用了标准的 `glob` loader：

```typescript title="content.config.ts (优化前)"
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
    loader: glob({
        pattern: ["*.{md,mdx}"],
        base: "stalux/posts/",
        generateId: ({ data }) => String(data["abbrlink"]),
        // 注意：这里没有 retainBody 选项，默认为 true
    }),
    schema: z.object({
        title: z.string(),
        abbrlink: z.string(),
        date: z.date(),
        // ... 其他字段
        desc: z.string().optional(),
        minutesRead: z.string().optional(),
        wordCount: z.number().optional(),
    }),
});
```

同时在文章列表页，我通过以下方式获取文章信息：

```typescript title="PostList.astro (优化前)"
---
import { getCollection } from "astro:content";
import { convertMarkdownToText } from "@/utils/markdown";

const posts = await getCollection("posts");

// 为每篇文章计算描述、阅读时间和字数
const postsWithMeta = await Promise.all(
  posts.map(async (post) => {
    // ⚠️ 问题1：需要访问 post.body 获取原始内容
    const plainText = convertMarkdownToText(post.body || "");

    // ⚠️ 问题2：每次都要重新计算
    const wordCount = plainText.length;
    const minutesRead = Math.ceil(wordCount / 500) + " 分钟";
    const desc = plainText.slice(0, 125) + "...";

    return { ...post, wordCount, minutesRead, desc };
  })
);
---
```

### 性能瓶颈

这个方案存在三个严重问题：

| 问题         | 影响                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| **重复存储** | `post.body` 保存了完整的原始 Markdown 文本，这部分数据在最终 HTML 中并不需要 |
| **重复计算** | 每次构建时，150+ 篇文章的字数、阅读时间都要重新计算                          |
| **数据传输** | 大量的 `body` 内容被序列化到构建数据中，增加了 I/O 开销                      |

通过分析，我发现 `post.body` 占用了存储空间的 **60% 以上**，而这些数据仅用于生成描述和统计信息。

---

## 解决方案：Astro 5.17 `retainBody` + Remark 插件

### 第一步：升级 Astro 到 5.17+

Astro 5.17 引入了 `retainBody` 选项，允许我们在 `glob()` loader 中禁用原始内容的保存：

```bash title="升级 Astro"
bun update astro
```

### 第二步：创建 Remark 插件

Remark 插件可以在 Markdown 解析阶段直接操作 AST（抽象语法树），这是提取信息的**关键时机**——此时内容已经被解析，但还未生成 HTML。

创建 `src/utils/remark-post-body.ts`：,此处灵感来源于官方文档[添加阅读时间](https://docs.astro.build/zh-cn/recipes/reading-time/)

```typescript title="src/utils/remark-post-body.ts"
import getReadingTime from "reading-time";
import { toString } from "mdast-util-to-string";

export function remarkPostBody() {
    return function (tree: unknown, { data }: { data: any }) {
        // 将 AST 转换为纯文本
        const textOnPage = toString(tree);

        // 计算阅读时间
        const readingTime = getReadingTime(textOnPage);

        // 直接将数据写入 frontmatter
        // 这些数据会被自动保存到文章元数据中
        data.astro.frontmatter.wordCount = textOnPage.length;
        data.astro.frontmatter.desc = textOnPage.slice(0, 125) + "...";
        data.astro.frontmatter.minutesRead = readingTime.text;
    };
}
```

1. **`mdast-util-to-string`**：将 Markdown AST 转换为纯文本，去除所有格式标记
2. **`reading-time`**：基于文本长度智能计算阅读时间
3. **`data.astro.frontmatter`**：修改 frontmatter,注意,这不是**直接**修改,为了保持`zod`格式校验,astro使用`remarkPluginFrontmatter`，这是一个虚拟的 frontmatter，只有在渲染时才会生效。

### 第三步：配置 Markdown 插件

在 `astro.config.mjs` 中注册 Remark 插件：

```typescript title="astro.config.mjs"
import { remarkPostBody } from "./src/utils/remark-post-body.js";
import remarkToc from "remark-toc";
import remarkMath from "remark-math";

export default defineConfig({
    markdown: {
        // 确保 remarkPostBody 最先执行
        remarkPlugins: [remarkPostBody, [remarkToc, { heading: "toc", maxDepth: 7 }], remarkMath],
        rehypePlugins: [[rehypeKatex, { strict: false }], rehypePhotoswipe],
        smartypants: true,
        gfm: true,
    },
});
```

### 第四步：启用 `retainBody: false`

修改 `content.config.ts`，在需要优化的集合中禁用 body 保留：

```typescript title="content.config.ts (优化后)"
import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
    loader: glob({
        pattern: ["*.{md,mdx}"],
        base: "stalux/posts/",
        generateId: ({ data }) => String(data["abbrlink"]),
        // ✨ 关键配置：不保留原始 body
        retainBody: false,
    }),
    schema: z.object({
        title: z.string(),
        abbrlink: z.string().or(z.number().transform((num) => num.toString())),
        date: z.preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date()),
        updated: z.preprocess(
            (v) => (v == null ? undefined : typeof v === "string" ? new Date(v) : v),
            z.date().optional(),
        ),
        draft: z.boolean().optional().default(false),
        tags: z.preprocess(
            (val) => (typeof val === "string" ? [val] : val),
            z.array(z.string()).optional(),
        ),
        categories: z.preprocess(
            (val) => (typeof val === "string" ? [val] : val),
            z.array(z.string()).optional(),
        ),
        // ✨ 这些字段现在由 remark 插件自动填充
        desc: z.string().optional(),
        minutesRead: z.string().optional(),
        wordCount: z.number().optional(),
        cc: z.string().optional().default("CC-BY-NC-SA-4.0"),
    }),
});

// 关于页面同样优化
const about = defineCollection({
    loader: glob({
        base: "stalux/about",
        pattern: "**/*.{md,mdx}",
        retainBody: false,
    }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
    }),
});

export const collections = { posts, about, config };
```

### 第五步：简化组件代码

现在文章列表页可以直接使用预计算的元数据：

```astro title="PostList.astro (优化后)"
---
import { getCollection } from "astro:content";
// 直接获取，无需额外处理
const posts = await getCollection("posts");
// ✨ 无需再计算 wordCount、minutesRead、desc
// 这些数据已经从 frontmatter 中直接可用
---
<ul>
  {posts.map((post) => (
    <li>
      <h2>{post.data.title}</h2>
      <!-- 直接使用预计算的数据 -->
      <p class="desc">{post.data.desc}</p>
      <span class="meta">
        {post.data.wordCount} 字 · {post.data.minutesRead}
      </span>
    </li>
  ))}
</ul>
```

## 高级应用：站点总字数统计

对于需要汇总统计的场景（如站点总字数），我们需要在渲染时获取生成虚拟的 `remarkPluginFrontmatter`：

```typescript title="src/utils/word-count-utils.ts"
import { getCollection, render } from "astro:content";

/**
 * 获取所有文章的总字数
 * 注意：wordCount 是通过 remark 插件动态生成的虚拟 frontmatter，
 * 需要通过 render() 函数获取
 */
export async function getTotalWordCount(): Promise<number> {
    try {
        const posts = await getCollection("posts");
        let totalWords = 0;

        for (const post of posts) {
            // render() 会返回 remarkPluginFrontmatter
            const { remarkPluginFrontmatter } = await render(post);
            totalWords += remarkPluginFrontmatter.wordCount || 0;
        }

        return totalWords;
    } catch (error) {
        console.error("计算文章总字数时出错:", error);
        return 0;
    }
}

/**
 * 格式化字数显示
 */
export function formatWordCount(count: number): string {
    if (count >= 10000) {
        return `${(count / 10000).toFixed(1)}万`;
    } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
}
```

使用方式：

```astro title="Footer.astro"
---
import { getTotalWordCount, formatWordCount } from "@/utils/word-count-utils";

const totalWords = await getTotalWordCount();
const formattedCount = formatWordCount(totalWords);
---

<footer>
  <p>本站累计 {formattedCount} 字</p>
</footer>
```

---

## 效果对比

### 构建时间对比

| 指标     | 优化前 | 优化后 | 提升     |
| -------- | ------ | ------ | -------- |
| 构建时间 | 18.2s  | 13.1s  | **-28%** |

## 注意事项

### 1. 何时需要 `retainBody: true`？

根据[官方博客](https://astro.build/blog/astro-5170/)的建议，以下场景仍然需要保留 `body`：

- **RSS 生成**：需要输出原始 Markdown
- **全文搜索**：需要索引原始文本
- **内容导出**：提供 Markdown 下载功能

对于这些场景，可以单独创建一个保留 body 的集合，或者通过文件系统直接读取。

### 3. 兼容 `render()` 函数

当 `retainBody: false` 时，`render()` 函数仍然可用，它会从原始文件重新解析内容：

```typescript
import { getEntry, render } from "astro:content";

const post = await getEntry("posts", "cbab25fa");
const { Content, remarkPluginFrontmatter } = await render(post);

// Content: 可渲染的 Astro 组件
// remarkPluginFrontmatter: 包含 wordCount、desc 等动态数据
```

---

## 总结

通过 Astro 5.17 的 `retainBody` 选项和自定义 Remark 插件，实现了去除不必要保存的内容,减少不必要的I/O,这个优化方案特别适合内容密集型网站。如果你的 Astro 项目构建时间随着文章增长而变慢，强烈建议尝试这个方案。
