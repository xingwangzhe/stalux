// 从独立 schema 文件导入 config 联合 schema
import { configSchema } from "@schemas/config";
// 2. 导入加载器
import { glob } from "astro/loaders";
// 3. 导入 Zod
import { z } from "astro/zod";
// 1. 从 `astro:content` 导入工具函数
import { defineCollection } from "astro:content";

// ---------------------------------------------------------------------------
// 4. 定义你的集合
// ---------------------------------------------------------------------------

const posts = defineCollection({
    loader: glob({
        pattern: ["*.{md,mdx}"],
        base: "stalux/posts/",
        generateId: ({ data }) => String(data["abbrlink"]),
        retainBody: true,
        deferRender: true,
    }),
    schema: z.object({
        title: z.string().min(1, "title is required"),
        abbrlink: z
            .string({ invalid_type_error: "abbrlink must be a string or number" })
            .or(z.number().transform((num) => num.toString())),
        date: z
            .string({
                required_error: "date is required",
                invalid_type_error: "date must be a string",
            })
            .min(1, "date is required, format: YYYY-MM-DD HH:mm:ss"),
        updated: z.string().optional(),
        draft: z.boolean().optional().default(false),
        tags: z.preprocess(
            (val) => (typeof val === "string" ? [val] : val),
            z.array(z.string()).optional(),
        ),
        categories: z.preprocess(
            (val) => (typeof val === "string" ? [val] : val),
            z.array(z.string()).optional(),
        ),
        desc: z
            .string({
                required_error: "desc is required",
                invalid_type_error: "desc must be a string",
            })
            .min(1, "desc is required"),
        minutesRead: z.string().optional(),
        wordCount: z.number().optional(),
        cc: z.string().optional().default("CC-BY-NC-SA-4.0"),
        cover: z.string().optional(),
    }),
});

const config = defineCollection({
    loader: glob({
        pattern: ["*.yml"],
        base: "stalux/config/",
        generateId: ({ data }) => String(data["id"]),
    }),
    schema: configSchema,
});

const about = defineCollection({
    loader: glob({ base: "stalux/about", pattern: "**/*.{md,mdx}", retainBody: true }),
    schema: z.object({
        title: z.string().min(1, "about.title is required"),
        description: z.string().min(1, "about.description is required"),
    }),
});

const words = defineCollection({
    loader: glob({
        pattern: ["*.md"],
        base: "stalux/words/",
        retainBody: true,
        deferRender: true,
    }),
    schema: z.object({
        source: z.string().optional(),
        link: z.string().url("words.link must be a valid URL").optional(),
        sourceDate: z.string().optional(),
        date: z.string().optional(),
        updated: z.string().optional(),
        draft: z.boolean().optional().default(false),
        title: z.string().optional(),
        abbrlink: z.string().optional(),
        tags: z.array(z.string()).optional(),
    }),
});

// ---------------------------------------------------------------------------
// 5. 导出
// ---------------------------------------------------------------------------

export const collections = {
    posts,
    about,
    config,
    words,
};
