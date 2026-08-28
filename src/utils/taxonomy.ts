import type { GetStaticPathsResult } from "astro";

import { getRuntimeCacheKey } from "../internal/runtime-cache-key";
import { getPostContentIndex, type TaxonomyKey } from "./content-index";

/**
 * 为 tags / categories 分类页生成 getStaticPaths 结果。
 *
 * 复杂度优化：每个 post 只解析一次时间（`postTs`），
 * 用数字时间戳比较“最近更新”，避免原实现在内层循环里反复
 * `new Date()` 解析同一个时间字符串（最坏 O(n × 平均标签数) 次 Date 构造）。
 */
export async function buildTaxonomyStaticPaths(key: TaxonomyKey): Promise<GetStaticPathsResult> {
    const index = await getPostContentIndex();
    const paramName = key === "tags" ? "tag" : "category";
    const taxonomy = index[key];

    return [...taxonomy].map(([name, entry]) => {
        return {
            params: { [paramName]: name },
            cacheKey: `${entry.cacheKey}|${getRuntimeCacheKey()}`,
            props: {
                [paramName]: name,
                count: entry.posts.length,
                posts: entry.posts,
                lastUpdateDate: entry.latestTime,
            },
        };
    });
}
