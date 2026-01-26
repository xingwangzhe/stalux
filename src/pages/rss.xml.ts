import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { stripHtml } from "string-strip-html";

export const GET: APIRoute = async (context) => {
    const configCollection = await getCollection("config");
    const stalux = configCollection[0]?.data;

    // 获取所有非草稿文章
    const posts = await getCollection("posts", ({ data }) => !data.draft);

    // 按日期排序
    const sortedPosts = posts.sort((a, b) => {
        const dateA = new Date(b.data.updated || b.data.date);
        const dateB = new Date(a.data.updated || a.data.date);
        return dateA.getTime() - dateB.getTime();
    });

    return rss({
        title: stalux?.title || "Stalux Blog",
        description: stalux?.description || "A blog powered by Stalux theme",
        site: context.site?.toString() || stalux?.url || "https://stalux.needhelp.icu",
        items: sortedPosts.map((post) => ({
            title: post.data.title,
            pubDate: new Date(post.data.date),
            description: stripHtml(post.rendered?.html.substring(0, 150) || "").result,
            link: `/posts/${post.data.abbrlink}/`,
            categories: post.data.categories || [],
        })),
        customData: `<language>zh-cn</language>`,
    });
};
