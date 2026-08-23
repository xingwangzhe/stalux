/**
 * Stalux 内容集合定义辅助
 *
 * 用户在 `src/content.config.ts` 中使用此函数快速配置内容集合，
 * 支持自定义内容目录路径。
 *
 * @example
 * ```ts
 * // src/content.config.ts
 * import { defineCollections } from "stalux/schemas";
 *
 * export const collections = defineCollections({
 *   contentDir: "./stalux",  // 默认为 "./stalux"
 * });
 * ```
 */

import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

import { configSchema } from "./config";

// ---------------------------------------------------------------------------
// 集合配置选项
// ---------------------------------------------------------------------------

export interface CollectionPaths {
    /** 内容根目录（默认 "stalux"） */
    contentDir?: string;
}

// ---------------------------------------------------------------------------
// 文章 Schema
// ---------------------------------------------------------------------------

const postSchema = z.object({
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
    cc: z.string().optional().default("CC-BY-NC-SA-4.0"),
    cover: z.string().optional(),
});

// ---------------------------------------------------------------------------
// 定义集合
// ---------------------------------------------------------------------------

/**
 * 快速配置 Stalux 所需的四个内容集合（posts / config / about / words）。
 *
 * @param paths - 内容目录路径配置
 * @returns 四个内容集合，可直接在 `src/content.config.ts` 中导出
 */
export function defineCollections(paths: CollectionPaths = {}) {
    const root = paths.contentDir ?? "stalux";

    const posts = defineCollection({
        loader: glob({
            pattern: ["*.{md,mdx}"],
            base: `${root}/posts/`,
            generateId: ({ data }) => String((data as Record<string, unknown>).abbrlink ?? ""),
            retainBody: true,
            deferRender: true,
        }),
        schema: postSchema,
    });

    const config = defineCollection({
        loader: glob({
            pattern: ["*.yml"],
            base: `${root}/config/`,
            generateId: ({ data }) => String((data as Record<string, unknown>).id ?? ""),
        }),
        schema: configSchema,
    });

    const about = defineCollection({
        loader: glob({
            base: `${root}/about`,
            pattern: "**/*.{md,mdx}",
            retainBody: true,
        }),
        schema: z.object({
            title: z.string().min(1, "about.title is required"),
            description: z.string().min(1, "about.description is required"),
        }),
    });

    const words = defineCollection({
        loader: glob({
            pattern: ["*.md"],
            base: `${root}/words/`,
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

    return { posts, config, about, words };
}

/**
 * 默认内容集合（使用 "stalux" 作为内容根目录）
 */
export const collections = defineCollections({ contentDir: "stalux" });
