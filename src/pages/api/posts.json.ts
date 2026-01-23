import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

// 预渲染此页面，确保优先生成
export const prerender = true;

export const GET: APIRoute = async (context) => {
    let posts = await getCollection('posts');

    posts = posts.sort((a, b) => {
        const dateA = new Date(b.data.date || 0);
        const dateB = new Date(a.data.date || 0);
        return dateA.getTime() - dateB.getTime();
    });

    return new Response(JSON.stringify({
        Posts: posts.map((post) => ({
            title: post.data.title,
            date: post.data.date,
            updated: post.data.updated,
            // description: stripHtml(post.rendered?.html || "无内容").result.slice(0, 150),
            link: `/posts/${post.data.abbrlink}/`,
            abbrlink: post.data.abbrlink,
            tags: post.data.tags || [],
            categories: post.data.categories || [],
        }))
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};
