import { getCollection } from 'astro:content';
import removeMd from 'remove-markdown';

/**
 * 获取所有文章的总字数
 * @returns Promise<number> 总字数
 */
export async function getTotalWordCount(): Promise<number> {
  try {
    const posts = await getCollection('posts');
    let totalWords = 0;

    for (const post of posts) {
      // 从文章内容中提取纯文本
      const plainText = removeMd(post.body || '');

      // 计算字数（中文字符算1个字，英文单词算1个字）
      const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
      totalWords += words.length;

      // 额外统计中文字符（因为中文字符在split后可能被分开）
      const chineseChars = plainText.match(/[\u4e00-\u9fa5]/g);
      if (chineseChars) {
        totalWords += chineseChars.length;
      }
    }

    return totalWords;
  } catch (error) {
    console.error('计算文章总字数时出错:', error);
    return 0;
  }
}

/**
 * 格式化字数显示
 * @param count 字数
 * @returns 格式化后的字数字符串
 */
export function formatWordCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  } else {
    return count.toString();
  }
}
