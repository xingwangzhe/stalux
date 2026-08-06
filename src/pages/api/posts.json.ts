import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

/**
 * 文章元信息索引（供 WebMCP 工具与外部消费）
 *
 * 相比 /api/post.abbrlink.json，包含完整元信息（日期/分类/标签/摘要/字数），
 * 是 stalux_get_post / stalux_random_post 等 WebMCP 工具的廉价数据源。
 */
export const GET: APIRoute = async () => {
    const posts = await getCollection("posts", ({ data }) => !data.draft);

    const payload = posts.map((post) => ({
        title: post.data.title,
        abbrlink: String(post.data.abbrlink),
        date: post.data.date ?? undefined,
        updated: post.data.updated ?? undefined,
        tags: post.data.tags ?? [],
        categories: post.data.categories ?? [],
        desc: post.data.desc ?? "",
        wordCount: post.data.wordCount ?? undefined,
        url: `/posts/${post.data.abbrlink}/`,
    }));

    return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
    });
};
