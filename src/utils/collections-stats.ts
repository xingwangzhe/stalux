import type { AstroRuntimeLogger } from "astro";
import { getPostContentIndex, type PostEntry } from "./content-index";

/**
 * 统计 posts 中每个分类键出现的次数。
 * @param posts 文章集合
 * @param keyFn 从单篇文章取出若干分类键（如标签、分类）
 * @param defaultValue 文章没有任何分类键时的兜底分类名（可选）
 */
function countBy(
    posts: PostEntry[],
    keyFn: (post: PostEntry) => string[] | undefined,
    defaultValue?: string,
): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>();
    for (const post of posts) {
        const keys = keyFn(post) ?? [];
        const names = keys.length > 0 ? keys : defaultValue ? [defaultValue] : [];
        for (const name of names) {
            counts.set(name, (counts.get(name) ?? 0) + 1);
        }
    }
    return [...counts].map(([name, count]) => ({ name, count }));
}

/**
 * 获取标签计数统计（用于标签云）
 * @returns Array<{ name: string; count: number }>
 */
export async function getTagCountList(logger?: AstroRuntimeLogger) {
    const { tags } = await getPostContentIndex(logger);
    return [...tags.values()].map(({ name, posts }) => ({ name, count: posts.length }));
}

/**
 * 获取分类计数统计（用于分类列表）
 * @returns Array<{ name: string; count: number }>
 */
export async function getCategoryCountList(logger?: AstroRuntimeLogger) {
    const { posts, categories } = await getPostContentIndex(logger);
    const counts = [...categories.values()].map(({ name, posts: categoryPosts }) => ({
        name,
        count: categoryPosts.length,
    }));
    const uncategorized = countBy(posts, (post) => post.data.categories, "uncategorized").find(
        ({ name }) => name === "uncategorized",
    );
    if (uncategorized) counts.push(uncategorized);
    return counts;
}
