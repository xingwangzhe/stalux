import { getCollection } from "astro:content";

/**
 * 获取标签计数统计（用于标签云）
 * @returns Array<{ name: string; count: number }>
 */
export async function getTagCountList() {
    const posts = await getCollection("posts");
    const tagMap = new Map<string, number>();

    posts.forEach((post) => {
        if (post.data.tags) {
            post.data.tags.forEach((tag) => {
                if (tagMap.has(tag)) {
                    tagMap.set(tag, tagMap.get(tag)! + 1);
                } else {
                    tagMap.set(tag, 1);
                }
            });
        }
    });

    return Array.from(tagMap, ([name, count]) => ({ name, count }));
}

/**
 * 获取分类计数统计（用于分类列表）
 * @returns Array<{ name: string; count: number }>
 */
export async function getCategoryCountList() {
    const posts = await getCollection("posts");
    const categoryMap = new Map<string, number>();

    posts.forEach((post) => {
        const categories = post.data.categories || ["未分类"];
        categories.forEach((cat) => {
            if (categoryMap.has(cat)) {
                categoryMap.set(cat, categoryMap.get(cat)! + 1);
            } else {
                categoryMap.set(cat, 1);
            }
        });
    });

    return Array.from(categoryMap, ([name, count]) => ({ name, count }));
}
