// 1. 从 `astro:content` 导入工具函数
import { defineCollection } from "astro:content";

// 2. 导入加载器
import { glob, file } from "astro/loaders";

// 3. 导入 Zod
import { z } from "astro/zod";

// 4. 定义你的集合
const posts = defineCollection({
  loader: glob({
    pattern: ["*.{md,mdx}"],
    base: "src/content/posts/",
  }),
  schema: z.object({
    title: z.string(),
    abbrlink: z.string() || z.number().transform((num) => num.toString()),
    date: z.preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date()),
    updated: z.preprocess(
      (v) => (v == null ? undefined : typeof v === "string" ? new Date(v) : v),
      z.date().optional()
    ),
    draft: z.boolean().optional().default(false),
    tags: z.preprocess(
      (val) => (typeof val === "string" ? [val] : val),
      z.array(z.string()).optional()
    ),
    categories: z.preprocess(
      (val) => (typeof val === "string" ? [val] : val),
      z.array(z.string()).optional()
    ),
  }),
});
const config = defineCollection({
  loader: file("config.yml"),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    description: z.string(),
    canonical: z.string().url().optional(),
    twitterSite: z.string().optional(),
    noindex: z.boolean().optional().default(false),
    nofollow: z.boolean().optional().default(false),
    anyhead: z.string().optional(),
    author: z.object({
      name: z.string(),
      avatar: z.string(),
      bio: z.string(),
    }),
    navs: z.array(
      z.object({
        title: z.string(),
        icon: z.string(),
        link: z.string(),
      })
    ),
    typetexts: z.array(z.string()).optional(),
    mediaLinks: z.array(
      z.object({
        icon: z.string(),
        link: z.string(),
      })
    ).optional(),
    footer: z.object({
      icp: z.string().optional(),
      pubsec: z.string().optional(),
    }),
  }),
});

// 5. 导出一个 `collections` 对象来注册你的集合
export const collections = { posts, config };
