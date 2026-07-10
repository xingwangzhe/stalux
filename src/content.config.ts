// 2. 导入加载器
import { glob, file } from "astro/loaders";
// 3. 导入 Zod
import { z } from "astro/zod";
// 1. 从 `astro:content` 导入工具函数
import { defineCollection } from "astro:content";

// 4. 定义你的集合
const posts = defineCollection({
    loader: glob({
        pattern: ["*.{md,mdx}"],
        base: "stalux/posts/",
        generateId: ({ data }) => String(data["abbrlink"]),
        retainBody: true,
    }),
    schema: z.object({
        title: z.string().min(1, "title 不能为空"),
        abbrlink: z
            .string({ invalid_type_error: "abbrlink 必须是字符串或数字" })
            .or(z.number().transform((num) => num.toString())),
        date: z
            .string({ required_error: "date 为必填字段", invalid_type_error: "date 必须是字符串" })
            .min(1, "date 不能为空，格式: YYYY-MM-DD HH:mm:ss"),
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
                required_error: "desc 为必填字段，请手写文章描述",
                invalid_type_error: "desc 必须是字符串",
            })
            .min(1, "desc 不能为空"),
        minutesRead: z.string().optional(),
        wordCount: z.number().optional(),
        cc: z.string().optional().default("CC-BY-NC-SA-4.0"),
        cover: z.string().optional(),
    }),
});
const config = defineCollection({
    loader: file("config.yml"),
    schema: z.object({
        lang: z.string().optional().default("zh-CN"),
        title: z.string().min(1, "config.title 不能为空"),
        url: z.string().url("config.url 必须是合法 URL，例如 https://example.com"),
        timezone: z.string().optional().default("Asia/Shanghai"),
        description: z.string().min(1, "config.description 不能为空"),
        canonical: z.string().url("config.canonical 必须是合法 URL").optional(),
        twitterSite: z.string().optional(),
        noindex: z.boolean().optional().default(false),
        nofollow: z.boolean().optional().default(false),
        head: z
            .object({
                googleAnalyticsId: z.string().optional(),
                bingClarityId: z.string().optional(),
                umami: z
                    .object({
                        id: z.string().optional(),
                        url: z.string().optional(),
                    })
                    .optional(),
                anyhead: z.string().optional(),
            })
            .optional(),
        favicon: z.string().optional().default("/favicon.ico"),
        author: z.object({
            name: z.string().min(1, "config.author.name 不能为空"),
            avatar: z.string().min(1, "config.author.avatar 不能为空"),
            bio: z.string().min(1, "config.author.bio 不能为空"),
        }),
        navs: z.array(
            z.object({
                title: z.string().min(1, "navs[].title 不能为空"),
                icon: z.string().min(1, "navs[].icon 不能为空"),
                link: z.string().min(1, "navs[].link 不能为空"),
            }),
        ),
        typetexts: z.array(z.string()).optional(),
        mediaLinks: z
            .array(
                z.object({
                    icon: z.string().min(1, "mediaLinks[].icon 不能为空"),
                    link: z.string().min(1, "mediaLinks[].link 不能为空"),
                }),
            )
            .optional(),
        links: z.object({
            title: z.string().min(1, "links.title 不能为空"),
            description: z.string(),
            sites: z.array(
                z.object({
                    name: z.string().min(1, "links.sites[].name 不能为空"),
                    description: z.string(),
                    icon: z.string().min(1, "links.sites[].icon 不能为空"),
                    link: z.string().min(1, "links.sites[].link 不能为空"),
                }),
            ),
        }),
        footer: z
            .object({
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
                badges: z
                    .array(
                        z.object({
                            label: z.string().min(1, "footer.badges[].label 不能为空"),
                            message: z.string().min(1, "footer.badges[].message 不能为空"),
                            color: z.string().optional(),
                            style: z.string().optional(),
                            alt: z.string().optional(),
                            href: z.string().optional(),
                        }),
                    )
                    .optional(),
                custom: z.string().optional(),
            })
            .optional(),
        comment: z
            .object({
                enabled: z.boolean().optional().default(false),
                waline: z
                    .object({
                        serverURL: z
                            .string()
                            .url("comment.waline.serverURL 必须是合法 URL")
                            .optional(),
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
            })
            .optional(),
        llm_promote: z.string().optional(),
    }),
});
const about = defineCollection({
    loader: glob({ base: "stalux/about", pattern: "**/*.{md,mdx}", retainBody: false }),
    schema: z.object({
        title: z.string().min(1, "about.title 不能为空"),
        description: z.string().min(1, "about.description 不能为空"),
    }),
});

const words = defineCollection({
    loader: glob({
        pattern: ["*.md"],
        base: "stalux/words/",
        retainBody: false,
    }),
    schema: z.object({
        source: z.string().optional(),
        link: z.string().url("words.link 必须是合法 URL").optional(),
        sourceDate: z.string().optional(),
        date: z.string().optional(),
        updated: z.string().optional(),
        draft: z.boolean().optional().default(false),
    }),
});

// 5. 导出一个 `collections` 对象来注册你的集合
export const collections = { posts, about, config, words };
