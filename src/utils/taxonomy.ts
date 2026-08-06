import { toTimestamp } from "@utils/dayjs";
import { getCollection, type CollectionEntry, type GetStaticPathsResult } from "astro:content";

type TaxonomyKey = "tags" | "categories";

/**
 * 为 tags / categories 分类页生成 getStaticPaths 结果。
 *
 * 复杂度优化：每个 post 只解析一次时间（`postTs`），
 * 用数字时间戳比较“最近更新”，避免原实现在内层循环里反复
 * `new Date()` 解析同一个时间字符串（最坏 O(n × 平均标签数) 次 Date 构造）。
 */
export async function buildTaxonomyStaticPaths(key: TaxonomyKey): Promise<GetStaticPathsResult> {
    const posts = await getCollection("posts", ({ data }) => !data.draft);
    const paramName = key === "tags" ? "tag" : "category";
    const map = new Map<
        string,
        { posts: CollectionEntry<"posts">[]; latestTs: number; latestTime: string }
    >();

    for (const post of posts) {
        const postTime = post.data.updated ?? post.data.date;
        const postTs = toTimestamp(postTime);
        for (const name of post.data[key] ?? []) {
            const entry = map.get(name) ?? { posts: [], latestTs: postTs, latestTime: postTime };
            entry.posts.push(post);
            if (postTs > entry.latestTs) {
                entry.latestTs = postTs;
                entry.latestTime = postTime;
            }
            map.set(name, entry);
        }
    }

    return [...map].map(([name, entry]) => {
        // 增量构建 cacheKey：该分类/标签下全部文章更新时间拼接，
        // 任一文章新增/编辑/变更分类都会改变列表输出并失效本页
        const cacheKey = entry.posts
            .map((p) => p.data.updated ?? p.data.date)
            .sort()
            .join("|");
        return {
            params: { [paramName]: name },
            cacheKey,
            props: {
                [paramName]: name,
                count: entry.posts.length,
                posts: entry.posts,
                lastUpdateDate: entry.latestTime,
            },
        };
    });
}
