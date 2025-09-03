import { render } from 'astro:content';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { description150 } from '../layouts/BlogPost.astro';

// 使用插件
dayjs.extend(utc);
dayjs.extend(timezone);

// 默认使用中国时区
dayjs.tz.setDefault('Asia/Shanghai');

/**
 * 格式化日期为中文格式
 * @param dateInput 日期输入
 * @returns 格式化后的中文日期字符串
 */
export const formatDate = (dateInput: any): string => {
  if (!dateInput) return '';

  try {
    // 直接使用dayjs解析各种格式的日期输入
    const date = dayjs(dateInput);

    if (!date.isValid()) return '';

    // 格式化为中文日期时间格式
    return date.format('YYYY年MM月DD日 HH:mm:ss');
  } catch (error) {
    console.warn('Date parsing error:', error, dateInput);
    return '';
  }
};

/**
 * 处理文章的 frontmatter 数据
 * @param post 文章数据对象
 * @returns 处理后的文章数据对象
 */
export async function processFrontmatter(post: any) {
  const { remarkPluginFrontmatter } = await render(post);
  
  // 处理 abbrlink
  const abbrlink = post.data.abbrlink || remarkPluginFrontmatter.abbrlink;
  
  // 处理创建日期和更新日期 - 统一格式化为中文日期格式
  const createDate = formatDate(remarkPluginFrontmatter.date);
  const updateDate = formatDate(remarkPluginFrontmatter.updated);
  
  // 创建一个新对象，包含处理后的数据
  return {
    ...post,
    data: {
      ...post.data,
      abbrlink,
      date: post.data.date || createDate,
      updated: post.data.updated || updateDate,
      description: post.data.description || description150(post.body),
    }
  };
}