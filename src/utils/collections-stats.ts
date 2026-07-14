import { getCollection, type CollectionEntry } from "astro:content";

type Post = CollectionEntry<"posts">;

/** 统一拉取已发布的文章集合，避免各统计函数重复查询。 */
async function getPosts(): Promise<Post[]> {
    return getCollection("posts", ({ data }) => !data.draft);
}

/**
 * 统计 posts 中每个分类键出现的次数。
 * @param posts 文章集合
 * @param keyFn 从单篇文章取出若干分类键（如标签、分类）
 * @param defaultValue 文章没有任何分类键时的兜底分类名（可选）
 */
function countBy(
    posts: Post[],
    keyFn: (post: Post) => string[] | undefined,
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
    return Array.from(counts, ([name, count]) => ({ name, count }));
}

/**
 * 获取标签计数统计（用于标签云）
 * @returns Array<{ name: string; count: number }>
 */
export async function getTagCountList() {
    const posts = await getPosts();
    return countBy(posts, (p) => p.data.tags);
}

/**
 * 获取分类计数统计（用于分类列表）
 * @returns Array<{ name: string; count: number }>
 */
export async function getCategoryCountList() {
    const posts = await getPosts();
    return countBy(posts, (p) => p.data.categories, "uncategorized");
}
