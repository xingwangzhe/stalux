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

import { defineCollection } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import { z } from "astro/zod";

import { isSocialImageUrl } from "../utils/social-image";
import { configSchema } from "./config";

/** Preserve glob's name, watch behavior and incremental store; only trace the load boundary. */
function tracedLoader(loader: Loader): Loader {
    return {
        ...loader,
        async load(context) {
            const logger = context.logger.fork(`stalux/content/${context.collection}`);
            const started = performance.now();
            logger.debug("load started");
            await loader.load(context);
            logger.debug(
                `load completed; entries=${context.store.entries().length}; elapsed=${(performance.now() - started).toFixed(1)}ms`,
            );
        },
    };
}

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

/**
 * 日期字段的严格格式：月/日/时/分/秒**必须补零**。
 *
 * 允许：`2025-07-04`、`"2025-07-04 18:44:32"`、`2025-05-10T12:00:00+08:00`。
 * 拒绝：`2026-6-9 9:11:00` 这类未补零写法——站点时区解析器（dayjs.ts
 * NAIVE_DATE_PATTERN）只认补零形式，未补零会静默回退到 new Date() 按
 * **构建机器本地时区**解释，导致 RSS/页面时间整体平移（2026-10-24 事故）。
 * 因此在 schema 层直接拒绝，让构建尽快失败，而不是产出错误时间。
 */
export const PADDED_DATETIME_PATTERN =
    /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

const datetimeField = (label: string) =>
    z
        .string({ error: `${label} must be a string` })
        .regex(
            PADDED_DATETIME_PATTERN,
            `${label} 月/日/时/分/秒必须补零，如 "2025-07-04 18:44:32"（拒绝 2026-6-9 9:11:00 这类未补零写法）`,
        );

/** words 的日期字段：允许空串（模板预留），非空时必须补零 */
const paddedOrEmpty = (label: string) =>
    z
        .string()
        .refine(
            (value) => value === "" || PADDED_DATETIME_PATTERN.test(value),
            `${label} 为空或月/日/时/分/秒必须补零，如 "2025-07-04 18:44:32"`,
        );

const postSchema = z.object({
    title: z.string().min(1, "title is required"),
    abbrlink: z.union([z.string(), z.number().transform((num) => num.toString())], {
        error: "abbrlink must be a string or number",
    }),
    date: datetimeField("date"),
    updated: datetimeField("updated").optional(),
    draft: z.boolean().optional().default(false),
    searchKeywords: z.array(z.string().trim().min(1)).optional(),
    tags: z.preprocess(
        (val) => (typeof val === "string" ? [val] : val),
        z.array(z.string()).optional(),
    ),
    categories: z.preprocess(
        (val) => (typeof val === "string" ? [val] : val),
        z.array(z.string()).optional(),
    ),
    desc: z.string({ error: "desc must be a string" }).min(1, "desc is required"),
    cc: z.string().optional().default("CC-BY-NC-SA-4.0"),
    cover: z.string().optional(),
    "og:image": z
        .string()
        .trim()
        .refine(
            (value) => value === "" || isSocialImageUrl(value),
            "og:image must be an HTTP(S) URL or site-root image path",
        )
        .optional(),
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
        loader: tracedLoader(
            glob({
                pattern: ["*.{md,mdx}"],
                base: `${root}/posts/`,
                generateId: ({ data }) => String((data as Record<string, unknown>).abbrlink ?? ""),
                retainBody: true,
                deferRender: true,
            }),
        ),
        schema: postSchema,
    });

    const config = defineCollection({
        loader: tracedLoader(
            glob({
                pattern: ["*.yml"],
                base: `${root}/config/`,
                generateId: ({ data }) => String((data as Record<string, unknown>).id ?? ""),
            }),
        ),
        schema: configSchema,
    });

    const about = defineCollection({
        loader: tracedLoader(
            glob({
                base: `${root}/about`,
                pattern: "**/*.{md,mdx}",
                retainBody: true,
            }),
        ),
        schema: z.object({
            title: z.string().min(1, "about.title is required"),
            description: z.string().min(1, "about.description is required"),
        }),
    });

    const words = defineCollection({
        loader: tracedLoader(
            glob({
                pattern: ["*.md"],
                base: `${root}/words/`,
                retainBody: true,
                deferRender: true,
            }),
        ),
        schema: z.object({
            source: z.string().optional(),
            link: z.url("words.link must be a valid URL").optional(),
            // sourceDate 是自由文本（如 "1950"、"春秋"），不是机器时间，不做格式约束
            sourceDate: z.string().optional(),
            // words 允许空串（_template.md 预留字段），非空时必须补零
            date: paddedOrEmpty("date").optional(),
            updated: paddedOrEmpty("updated").optional(),
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
