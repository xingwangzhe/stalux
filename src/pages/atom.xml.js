
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { config_site } from '../utils/yaml-config-adapter';
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
          id: `/posts/${post.data.abbrlink}/`, // Atom规范的唯一标识符
        };

        // 手动生成published和updated字段的XML标签
        let publishedXml = '';
        let updatedXml = '';

        if (post.data.date) {
          try {
            // published字段：文章的原始发布日期
            const publishedDate = new Date(post.data.date);
            if (!isNaN(publishedDate.getTime())) {
              publishedXml = `<published>${publishedDate.toISOString()}</published>`;
            }

            // updated字段：文章的最后更新日期，如果没有则使用发布日期
            const updatedSource = post.data.updated || post.data.modified || post.data.date;
            const updatedDate = new Date(updatedSource);
            if (!isNaN(updatedDate.getTime())) {
              updatedXml = `<updated>${updatedDate.toISOString()}</updated>`;
            } else if (publishedXml) {
              // 如果updated日期无效但published有效，使用published作为updated
              updatedXml = `<updated>${publishedDate.toISOString()}</updated>`;
            }
          } catch (error) {
            console.warn(`日期解析错误 for post ${post.data.title}:`, error);
            // 如果解析失败，使用当前时间作为默认值
            const now = new Date().toISOString();
            publishedXml = `<published>${now}</published>`;
            updatedXml = `<updated>${now}</updated>`;
          }
        } else {
          // 如果没有原始日期，使用当前时间
          const now = new Date().toISOString();
          publishedXml = `<published>${now}</published>`;
          updatedXml = `<updated>${now}</updated>`;
        }

        // 将XML标签添加到customData中，并添加更多Atom规范要求的元素
        item.customData = `${publishedXml}${updatedXml}`;

        // Atom规范：确保有作者信息
        if (post.data.author || config_site.author) {
          item.author = post.data.author || config_site.author;
        } else {
          // Atom规范要求必须有作者，如果没有则使用默认值
          item.author = 'xingwangzhe';
        }

        // 添加内容类型信息（Atom规范推荐）
        if (!item.customData.includes('<content')) {
          item.customData += `<content type="html">${post.data.description || ''}</content>`;
        }

        return item;
      }),
  });
}