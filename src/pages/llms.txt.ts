import { toTimestamp } from "@utils/dayjs";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getPostDescriptions } from "@utils/word-count-utils";

export const prerender = true;

export const GET: APIRoute = async (context) => {
    const configCollection = await getCollection("config");
    const config = configCollection[0]?.data;
    const site = context.site?.toString() || config?.url || "";

    let posts = await getCollection("posts", ({ data }) => !data.draft);

    posts = posts.sort((a, b) => {
        const dateA = toTimestamp(b.data.date || 0);
        const dateB = toTimestamp(a.data.date || 0);
        return dateA - dateB;
    });

    // 使用共享缓存的文章描述，避免每个 feed 各自渲染
    const descriptions = await getPostDescriptions();
    const parts = await Promise.all(
        posts.map(async (post) => {
            const title = post.data.title || "Untitled";
            const link = site.replace(/\/$/, "") + `/posts/${post.data.abbrlink}/`;
            const cached = descriptions.get(String(post.data.abbrlink));
            // 优先使用 remark 插件生成的描述，如果没有则使用文章自身的 desc
            const bodyText = cached?.desc || post.data.desc || "";
            return `Title: ${title}\nLink: ${link}\n\n${bodyText}\n\n----\n`;
        }),
    );

    const text = parts.join("\n");

    return new Response(text, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
};
