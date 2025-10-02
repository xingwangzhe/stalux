import { getCollection } from 'astro:content';
import { processFrontmatter } from '../../integrations/process-frontmatter.js';
import type { APIRoute } from 'astro';

// 预渲染此页面，确保优先生成
export const prerender = true;

export const GET: APIRoute = async (context) => {
  let posts = await getCollection('posts');

  // 处理frontmatter
  posts = await Promise.all(posts.map(async (post) => {
    return await processFrontmatter(post);
  }));
  
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
      description: post.data.description,
      link: `/posts/${post.data.abbrlink}/`,
      tags: post.data.tags || [],
    }))
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
