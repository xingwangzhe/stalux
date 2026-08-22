/**
 * Config 集合的 Zod Schema 定义
 *
 * 每个 config/*.yml 文件对应一个独立的 schema，
 * 通过 z.discriminatedUnion("id") 联合为 config 集合。
 */
import { z } from "astro/zod";

// ---------------------------------------------------------------------------
// 子 Schema（每个对应一个 config/*.yml 文件）
// ---------------------------------------------------------------------------

export const siteSchema = z.object({
    id: z.literal("site"),
    lang: z.string().optional().default("zh-CN"),
    title: z.string().min(1, "site.title is required"),
    url: z.string().url("site.url must be a valid URL"),
    description: z.string().min(1, "site.description is required"),
    seoTitle: z.string().min(1).optional(),
    timezone: z.string().optional().default("Asia/Shanghai"),
    canonical: z.string().url("site.canonical must be a valid URL").optional(),
    twitterSite: z.string().optional(),
    noindex: z.boolean().optional().default(false),
    nofollow: z.boolean().optional().default(false),
    favicon: z.string().optional().default("/favicon.ico"),
});

export const authorSchema = z.object({
    id: z.literal("author"),
    name: z.string().min(1, "author.name is required"),
    avatar: z.string().min(1, "author.avatar is required"),
    bio: z.string().min(1, "author.bio is required"),
    jobTitle: z.string().optional(),
});

export const headSchema = z.object({
    id: z.literal("head"),
    googleAnalyticsId: z.string().optional(),
    bingClarityId: z.string().optional(),
    umami: z
        .object({
            id: z.string().optional(),
            url: z.string().optional(),
        })
        .optional(),
    anyhead: z.string().optional(),
});

export const typetextsSchema = z.object({
    id: z.literal("typetexts"),
    items: z.array(z.string()),
});

export const navsSchema = z.object({
    id: z.literal("navs"),
    items: z.array(
        z.object({
            title: z.string().min(1, "navs[].title is required"),
            icon: z.string().min(1, "navs[].icon is required"),
            link: z.string().min(1, "navs[].link is required"),
        }),
    ),
});

export const mediaLinksSchema = z.object({
    id: z.literal("media-links"),
    items: z.array(
        z.object({
            icon: z.string().min(1, "mediaLinks[].icon is required"),
            link: z.string().min(1, "mediaLinks[].link is required"),
        }),
    ),
});

export const linksSchema = z.object({
    id: z.literal("links"),
    title: z.string().min(1, "links.title is required"),
    description: z.string(),
    sites: z.array(
        z.object({
            name: z.string().min(1, "links.sites[].name is required"),
            description: z.string(),
            icon: z.string().min(1, "links.sites[].icon is required"),
            link: z.string().min(1, "links.sites[].link is required"),
        }),
    ),
});

const badgeFlatSchema = z.object({
    label: z.string().min(1, "badges[].label is required"),
    message: z.string().min(1, "badges[].message is required"),
    color: z.string().optional(),
    style: z.string().optional(),
    alt: z.string().optional(),
    href: z.string().optional(),
    rel: z.string().optional(),
});

const badgeGroupSchema = z.object({
    title: z.string().min(1, "badge group title is required"),
    collapsed: z.boolean().optional().default(true),
    items: z.array(badgeFlatSchema),
});

export const footerSchema = z.object({
    id: z.literal("footer"),
    buildtime: z.string().optional(),
    copyright: z
        .object({
            enabled: z.boolean().optional().default(true),
            startYear: z.number().optional(),
            customText: z.string().optional(),
        })
        .optional(),
    theme: z
        .object({
            showPoweredBy: z.boolean().optional().default(true),
            showThemeInfo: z.boolean().optional().default(true),
        })
        .optional(),
    beian: z
        .object({
            icp: z
                .object({
                    enabled: z.boolean().optional().default(false),
                    number: z.string().optional(),
                })
                .optional(),
            security: z
                .object({
                    enabled: z.boolean().optional().default(false),
                    text: z.string().optional(),
                    number: z.string().optional(),
                })
                .optional(),
        })
        .optional(),
    badges: z.array(z.union([badgeFlatSchema, badgeGroupSchema])).optional(),
    custom: z.string().optional(),
});

export const aiDiscoverySchema = z.object({
    id: z.literal("ai-discovery"),
    conformance: z
        .enum(["disabled", "essential", "recommended", "complete"])
        .optional()
        .default("complete"),
    permissions_text: z.array(z.string()).optional(),
    restrictions_text: z.array(z.string()).optional(),
    attribution_text: z.string().optional(),
    contact_text: z.string().optional(),
});

export const commentSchema = z.object({
    id: z.literal("comment"),
    enabled: z.boolean().optional().default(false),
    waline: z
        .object({
            serverURL: z.string().url("comment.waline.serverURL must be a valid URL").optional(),
            lang: z.string().optional().default("zh-CN"),
            locale: z.any().optional(),
            emoji: z
                .array(z.string())
                .optional()
                .default([
                    "https://unpkg.com/@waline/emojis@1.1.0/bilibili",
                    "https://unpkg.com/@waline/emojis@1.1.0/bmoji",
                ]),
            reaction: z.boolean().optional().default(false),
            meta: z.array(z.string()).optional().default(["nick", "mail", "link"]),
            requiredMeta: z.array(z.string()).optional().default([]),
            login: z.string().optional().default("enable"),
            recaptchaV3Key: z.string().optional(),
            turnstileKey: z.string().optional(),
            dark: z.union([z.string(), z.boolean()]).optional().default(true),
            noCopyright: z.boolean().optional().default(false),
            commentSorting: z.string().optional().default("latest"),
            imageUploader: z.any().optional(),
            highlighter: z.any().optional(),
            texRenderer: z.any().optional(),
            search: z.any().optional(),
            wordLimit: z.number().optional().default(200),
            pageSize: z.number().optional().default(10),
        })
        .optional(),
});

export const promoteSchema = z.object({
    id: z.literal("promote"),
    llm_promote: z.string().optional(),
    export_md: z.boolean().optional().default(false),
});

// ---------------------------------------------------------------------------
// 联合 Schema（内容集合使用）
// ---------------------------------------------------------------------------

export const configSchema = z.discriminatedUnion("id", [
    siteSchema,
    authorSchema,
    headSchema,
    navsSchema,
    typetextsSchema,
    mediaLinksSchema,
    linksSchema,
    footerSchema,
    aiDiscoverySchema,
    commentSchema,
    promoteSchema,
]);

// ---------------------------------------------------------------------------
// 推导的 TypeScript 类型
// ---------------------------------------------------------------------------

type ConfigData = z.infer<typeof configSchema>;

// 按 id 提取的具体类型
export type SiteData = Extract<ConfigData, { id: "site" }>;
export type AuthorData = Extract<ConfigData, { id: "author" }>;
export type HeadData = Extract<ConfigData, { id: "head" }>;
export type NavsData = Extract<ConfigData, { id: "navs" }>;
export type TypetextsData = Extract<ConfigData, { id: "typetexts" }>;
export type MediaLinksData = Extract<ConfigData, { id: "media-links" }>;
export type LinksData = Extract<ConfigData, { id: "links" }>;
export type FooterData = Extract<ConfigData, { id: "footer" }>;
export type AiDiscoveryData = Extract<ConfigData, { id: "ai-discovery" }>;
export type CommentData = Extract<ConfigData, { id: "comment" }>;
export type PromoteData = Extract<ConfigData, { id: "promote" }>;
