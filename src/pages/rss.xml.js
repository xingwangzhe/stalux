
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { config_site } from '../utils/config-adapter.ts';
import { processFrontmatter } from '../integrations/process-frontmatter.ts';
export async function GET(context) {
  // 获取所有文章
  let posts = await getCollection('posts');
  // 处理frontmatter
  posts = await Promise.all(posts.map(async (post) => {
    return await processFrontmatter(post);
  }));
  return rss({
    title: config_site.siteName || 'Blog',
    description: config_site.description || '博客描述',
    site: context.site,
    items: posts
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
      .map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/posts/${post.data.abbrlink}/`,
      })),
    });
}