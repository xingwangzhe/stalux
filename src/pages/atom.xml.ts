import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { config_site } from '../utils/yaml-config-adapter.js';
import { processFrontmatter } from '../integrations/process-frontmatter.js';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  // 获取所有文章
  let posts = await getCollection('posts');
  
  // 处理frontmatter
  posts = await Promise.all(posts.map(async (post) => {
    return await processFrontmatter(post);
  }));
  
  return rss({
    title: config_site.siteName || 'Blog',
    description: config_site.description || '博客描述',
    site: context.site || config_site.url,
    items: posts
      .sort((a, b) => {
        const dateA = new Date(b.data.date || 0);
        const dateB = new Date(a.data.date || 0);
        return dateA.getTime() - dateB.getTime();
      })
      .map((post) => ({
        title: post.data.title,
        pubDate: new Date(post.data.date || 0),
        description: post.data.description,
        link: `/posts/${post.data.abbrlink}/`,
      })),
  });
};
