/**
 * 站点字数统计工具
 */
import { getCollection } from "astro:content";
import removeMd from "remove-markdown";

/**
 * 获取所有文章的总字数
 */
export async function getTotalWordCount(): Promise<number> {
    try {
        const posts = await getCollection("posts");
        let totalWords = 0;

        for (const post of posts) {
            const plainText = removeMd(post.body || "");
            const words = plainText.trim().split(/\s+/).filter((word) => word.length > 0);
            totalWords += words.length;

            const chineseChars = plainText.match(/[\u4e00-\u9fa5]/g);
            if (chineseChars) {
                totalWords += chineseChars.length;
            }
        }

        return totalWords;
    } catch (error) {
        console.error("计算文章总字数时出错:", error);
        return 0;
    }
}

/**
 * 格式化字数显示
 */
export function formatWordCount(count: number): string {
    if (count >= 10000) {
        return `${(count / 10000).toFixed(1)}万`;
    } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
}
