import { getCollection } from "astro:content";
import { analyzeFeatureFlags } from "@plugins/feature-flags";
import type { APIRoute } from "astro";

export const prerender = true;

/**
 * 文章元信息索引（供 WebMCP 工具与外部消费）
 *
 * 相比 /api/post.abbrlink.json，包含完整元信息（日期/分类/标签/摘要/字数），
 * 是 stalux_get_post / stalux_random_post 等 WebMCP 工具的廉价数据源。
 */
export const GET: APIRoute = async () => {
    const posts = await getCollection("posts", ({ data }) => !data.draft);

    const payload = await Promise.all(
        posts.map(async (post) => ({
            title: post.data.title,
            abbrlink: String(post.data.abbrlink),
            date: post.data.date ?? undefined,
            updated: post.data.updated ?? undefined,
            tags: post.data.tags ?? [],
            categories: post.data.categories ?? [],
            desc: post.data.desc ?? "",
            wordCount: (await analyzeFeatureFlags(post.body)).wordCount,
            url: `/posts/${post.data.abbrlink}/`,
        })),
    );

    return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=0, must-revalidate",
            "RateLimit-Limit": "60",
            "RateLimit-Remaining": "59",
            "RateLimit-Reset": "60",
        },
    });
};
