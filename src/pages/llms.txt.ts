import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import removeMarkdown from "remove-markdown";

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

    const parts = posts.map((post) => {
        const title = post.data.title || "Untitled";
        const link = site.replace(/\/$/, "") + `/posts/${post.data.abbrlink}/`;
        const bodyText = removeMarkdown(post.body || "");
        return `Title: ${title}\nLink: ${link}\n\n${bodyText}\n\n----\n`;
    });

    const text = parts.join("\n");

    return new Response(text, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
};
