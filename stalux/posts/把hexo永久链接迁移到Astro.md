---
title: 把Hexo永久链接迁移到Astro
date: 2026-1-28 15:06:10
updated: 2026-1-28 15:30:10
abbrlink: "move-hexo-permalink-to-astro"
tags:
  - Astro
  - Hexo
  - 永久链接
  - 迁移
categories:
  - Astro
---

从hexo生态过来的朋友们，可能会遇到一个问题，就是hexo的permlink(或abbrlink) 链接和astro的路由规则不太一样，导致之前的文章链接可能需要大批量更改导致无法访问。今天我们就来讲讲如何把hexo的永久链接迁移到astro。

## Hexo可能的永久链接规则

permlink或者abbrlink 目的都是为了通过一个短链接来访问文章,通常都是靠字母或者数字混在一起的路由,比如说`eef6378`或者`a1b2c3d4`这种形式的链接。Hexo的permlink或者abbrlink通常是通过插件生成的,目的是为了不让路由采用文件名而导致url在解析中文时的各种乱码,乱码的特征就是带有`%`符号的链接。而且这也会影响SEO,所以很多人都采用了这个方式。

## 迁移到Astro的考虑

如果你打算迁移到一些Astro 博客主题上的话,你会发现这些主题通常是也是通过文件名来生成路由的,比如说`/posts/把hexo永久链接迁移到Astro`这种形式的链接。这就导致了之前的permlink或者abbrlink无法访问,因为路由规则不匹配。

如果尽可能保持小的改动,确保路由能够由frontmatter的permlink或者abbrlink字段来控制,那就可以避免大批量修改文章链接的问题。

## 更改Astro的内容集合配置

### 直接更改

对于博客类型的内容,Astro的各种博客主题大部分都会在`/src/content.config.ts`或者`/src/content/config.ts`文件中定义内容集合

我们需要找到这个文件,然后找到对应的集合定义。以我这个[博客主题](https://github.com/xingwangzhe/stalux)为例子

```diff lang='ts' title="src/content.config.ts"
const posts = defineCollection({
  loader: glob({
    pattern: ["*.{md,mdx}"],
    base: "stalux/posts/",
+   generateId: ({ data }) => String(data["abbrlink"]), // 通过abbrlink字段来生成路由ID
  }),
  schema: z.object({
    title: z.string(),
+   abbrlink: z.string().or(z.number().transform((num) => num.toString())), // 支持字符串或者数字
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

对于abbrlink字段,有可能是纯数字,也有可能是字符串,所以我们需要在schema中定义支持字符串或者数字的类型,并且把数字转换成字符串。

```ts
abbrlink: z.string().or(z.number().transform((num) => num.toString())), // 支持字符串或者数字
```

然后在`generateId`函数中,我们通过frontmatter的`abbrlink`字段来生成路由ID,这样就可以确保路由和之前的hexo永久链接保持一致。

```ts
generateId: ({ data }) => String(data["abbrlink"]), // 通过abbrlink字段来生成路由ID
```

## 一举多得的好处

一方面,避免了大量的修改,另一方面,也确保了之前的永久链接依然可以访问,不会因为迁移而导致链接失效的问题,再者,以前通过文件系统不会重名的特性来作为路由ID,现在通过abbrlink字段来生成路由ID,也避免了重名的问题(此时重复ID会generateId函数会报错)。
总之,通过这种方式,我们可以轻松地把hexo的永久链接迁移到Astro,而且不需要大批量修改文章链接,非常方便.
