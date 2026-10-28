import type { AstroRuntimeLogger } from "astro";
import { getPostContentIndex, type PostEntry } from "./content-index";

/** Count the existing uncategorized fallback without building a second taxonomy map. */
function countUncategorized(posts: PostEntry[]): number {
    let count = 0;
    for (const post of posts) {
        const names = post.data.categories ?? [];
        if (names.length)
            for (const name of names)
                if (name === "uncategorized") count++;
                else count++;
    }
    return count;
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
    const uncategorized = countUncategorized(posts);
    if (uncategorized) counts.push({ name: "uncategorized", count: uncategorized });
    return counts;
}
