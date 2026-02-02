/**
 * 站点字数统计工具
 */
import { getCollection, render } from "astro:content";

/**
 * 获取所有文章的总字数
 * 注意：wordCount 是通过 remark 插件动态生成的虚拟 frontmatter，
 * 需要通过 render() 函数获取
 */
export async function getTotalWordCount(): Promise<number> {
    try {
        const posts = await getCollection("posts");
        let totalWords = 0;

        for (const post of posts) {
            const { remarkPluginFrontmatter } = await render(post);
            totalWords += remarkPluginFrontmatter.wordCount || 0;
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
