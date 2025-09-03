import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { config_site } from '../utils/yaml-config-adapter.ts';
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
      .sort((a, b) => {
        const dateA = new Date(a.data.date);
        const dateB = new Date(b.data.date);
        // 如果日期无效，将其排到后面
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        return dateB - dateA;
      })
      .map((post) => {
        const item = {
          title: post.data.title,
          description: post.data.description,
          link: `/posts/${post.data.abbrlink}/`,
          guid: `/posts/${post.data.abbrlink}/`, // RSS规范的唯一标识符
        };

        // RSS规范的pubDate字段处理
        if (post.data.date) {
          try {
            const postDate = new Date(post.data.date);
            if (!isNaN(postDate.getTime())) {
              // RSS使用RFC 2822格式的日期
              item.pubDate = postDate.toUTCString();
            }
          } catch (error) {
            console.warn(`RSS日期解析错误 for post ${post.data.title}:`, error);
          }
        }

        // 添加作者信息（RSS规范）
        if (post.data.author || config_site.author) {
          item.author = post.data.author || config_site.author;
        }

        // 添加分类信息（如果有的话）
        if (post.data.categories && post.data.categories.length > 0) {
          item.categories = post.data.categories;
        }

        return item;
      }),
    });
}