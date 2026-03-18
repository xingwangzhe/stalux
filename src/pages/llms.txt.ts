import type { APIRoute } from "astro";
import { getCollection, render } from "astro:content";

export const prerender = true;

export const GET: APIRoute = async (context) => {
    const configCollection = await getCollection("config");
    const config = configCollection[0]?.data;
    const site = context.site?.toString() || config?.url || "";

    let posts = await getCollection("posts", ({ data }) => !data.draft);

    posts = posts.sort((a, b) => {
        const dateA = new Date(b.data.date || 0).getTime();
        const dateB = new Date(a.data.date || 0).getTime();
        return dateA - dateB;
    });

    // 获取每篇文章的 remarkPluginFrontmatter 以使用动态生成的描述
    const parts = await Promise.all(
        posts.map(async (post) => {
            const title = post.data.title || "Untitled";
            const link = site.replace(/\/$/, "") + `/posts/${post.data.abbrlink}/`;
            const { remarkPluginFrontmatter } = await render(post);
            // 优先使用 remark 插件生成的描述，如果没有则使用文章自身的 desc
            const bodyText = remarkPluginFrontmatter.desc || post.data.desc || "";
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
