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
    base: "stalux/posts/",
    generateId: ({ data }) => String(data['abbrlink']),
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
    cc: z.string().optional().default("CC-BY-NC-SA-4.0"),
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
    favicon: z.string().optional().default("/favicon.ico"),
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
      }),
    ),
    typetexts: z.array(z.string()).optional(),
    mediaLinks: z
      .array(
        z.object({
          icon: z.string(),
          link: z.string(),
        }),
      )
      .optional(),
    links: z.object({
      title: z.string(),
      description: z.string(),
      sites: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          icon: z.string(),
          link: z.string(),
        }),
      ),
    }),
    footer: z.object({
      startYear: z.number().optional(),
      icp: z.string().optional(),
      pubsec: z.string().optional(),
      pubsecNumber: z.string().optional(),
      buildtime: z.string().optional(),
      copyright: z.object({
        enabled: z.boolean().optional().default(true),
        startYear: z.number().optional(),
        customText: z.string().optional(),
      }).optional(),
      theme: z.object({
        showPoweredBy: z.boolean().optional().default(true),
        showThemeInfo: z.boolean().optional().default(true),
      }).optional(),
      beian: z.object({
        icp: z.object({
          enabled: z.boolean().optional().default(false),
          number: z.string().optional(),
        }).optional(),
        security: z.object({
          enabled: z.boolean().optional().default(false),
          text: z.string().optional(),
          number: z.string().optional(),
        }).optional(),
      }).optional(),
      badges: z.array(z.object({
        label: z.string(),
        message: z.string(),
        color: z.string().optional(),
        style: z.string().optional(),
        alt: z.string().optional(),
        href: z.string().optional(),
      })).optional(),
      custom: z.string().optional(),
    }).optional(),
    comment: z.object({
      waline: z.object({
        serverURL: z.string().url().optional(),
        lang: z.string().optional().default("zh-CN"),
        emoji: z.array(z.string()).optional().default(["https://unpkg.com/@waline/emojis@1.1.0/weibo"]),
        reaction: z.boolean().optional().default(false),
        meta: z.array(z.string()).optional().default(["nick", "mail", "link"]),
        wordLimit: z.number().optional().default(200),
        pageSize: z.number().optional().default(10),
      }).optional(),
    }).optional(),
  }),
});
const about = defineCollection({
  loader: glob({ base: "stalux/about", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

// 5. 导出一个 `collections` 对象来注册你的集合
export const collections = { posts, about, config };
