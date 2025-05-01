import { render } from 'astro:content';
import dayjs from 'dayjs';

/**
 * 处理文章的 frontmatter 数据
 * @param post 文章数据对象
 * @returns 处理后的文章数据对象
 */
export async function processFrontmatter(post: any) {
  const { remarkPluginFrontmatter } = await render(post);
  
  // 处理 abbrlink
  const abbrlink = post.data.abbrlink || remarkPluginFrontmatter.abbrlink;
  
  // 处理创建日期和更新日期
  const createDate = dayjs(remarkPluginFrontmatter.date)
    .format("YYYY-MM-DD HH:mm:ss");
  const updateDate = dayjs(remarkPluginFrontmatter.updated)
    .format("YYYY-MM-DD HH:mm:ss");
  
  // 创建一个新对象，包含处理后的数据
  return {
    ...post,
    data: {
      ...post.data,
      abbrlink,
      date: typeof post.data.date === 'string' && post.data.date.trim() !== '' 
        ? post.data.date 
        : post.data.date instanceof Date 
          ? dayjs(post.data.date).format("YYYY-MM-DD HH:mm:ss") 
          : createDate,
      updated: typeof post.data.updated === 'string' && post.data.updated.trim() !== ''
        ? post.data.updated
        : post.data.updated instanceof Date
          ? dayjs(post.data.updated).format("YYYY-MM-DD HH:mm:ss")
          : updateDate
    }
  };
}