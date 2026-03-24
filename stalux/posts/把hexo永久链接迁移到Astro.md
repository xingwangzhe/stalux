---
title: 把Hexo永久链接迁移到Astro
date: "2026-01-28 15:06:10"
updated: "2026-01-28 15:30:10"
abbrlink: "move-hexo-permalink-to-astro"
tags:
    - Astro
    - Hexo
    - 永久链接
    - 迁移
categories:
    - Astro
---

从 **Hexo** 生态过来的朋友们，可能会遇到一个问题，就是 Hexo 的 `permalink`（或 `abbrlink`）和 **Astro** 的路由规则不太一样，导致之前的文章链接可能需要大批量更改而无法访问。今天我们就来讲讲如何把 Hexo 的永久链接迁移到 Astro。

## Hexo 可能的永久链接规则

`permalink` 或者 `abbrlink` 的目的是通过一个短链接来访问文章，通常由字母或数字混合组成，例如 `eef6378` 或 `a1b2c3d4`。Hexo 的 `permalink` / `abbrlink` 通常由插件生成，目的是避免路由使用文件名，从而在解析中文时产生 `%` 的 **URL 编码（导致乱码）**，这会影响 SEO，因此很多人采用这种方式。

## 迁移到 Astro 的考虑

如果你打算迁移到某些 **Astro 博客主题**，你会发现这些主题通常也通过文件名来生成路由，例如：`/posts/把hexo永久链接迁移到Astro`。这会导致之前的 `permalink` 或 `abbrlink` 无法访问，因为路由规则不匹配。

如果想 **尽可能保持小的改动**，可以让路由由 `frontmatter` 中的 `permalink` 或 `abbrlink` 字段来控制，这样就能 **避免大批量修改文章链接**。

## 更改 Astro 的内容集合配置

### 直接更改

对于博客类型的内容，大多数 Astro 主题会在 `src/content.config.ts` 或 `src/content/config.ts` 中定义集合。需要找到该文件并修改对应集合的定义，以我这个 [博客主题](https://github.com/xingwangzhe/stalux) 为例：

```diff lang='ts' title="src/content.config.ts"
const posts = defineCollection({
  loader: glob({
    pattern: ["*.{md,mdx}"],
    base: "stalux/posts/",
+   generateId: ({ data }) => String(data["abbrlink"]), // 通过 `abbrlink` 字段来生成路由 ID
  }),
  schema: z.object({
    title: z.string(),
+   abbrlink: z.string().or(z.number().transform((num) => num.toString())), // 支持字符串或数字
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
    cc: z.string().optional().default("CC-BY-NC-SA-4.0"),
  }),
});
```

### 解释

对于 `abbrlink` 字段，可能是纯数字也可能是字符串，因此在 `schema` 中要同时支持字符串或数字，并在需要时把数字转换为字符串：

```ts
abbrlink: z.string().or(z.number().transform((num) => num.toString())), // 支持字符串或数字
```

然后在 `generateId` 函数中，通过 `frontmatter` 的 `abbrlink` 字段生成路由 ID，确保路由与之前的 Hexo 永久链接保持一致：

```ts
generateId: ({ data }) => String(data["abbrlink"]), // 通过 `abbrlink` 字段来生成路由 ID
```

## 一举多得的好处

- **避免大量修改**：不需要手动改动每一篇文章的链接。
- **保持链接可用**：迁移后原有的短链接依然能访问。
- **需注意唯一性**：以前依赖文件系统生成的路由 ID 通常会避免重名；改为使用 `abbrlink` 时，请确保 `abbrlink` 在集合中**唯一**，否则 `generateId` 会抛出错误。

总之，通过这种方式，可以轻松地把 Hexo 的永久链接迁移到 Astro，并且无需大批量修改文章链接，**非常方便**。
