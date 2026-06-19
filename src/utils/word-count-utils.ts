/**
 * 站点字数统计工具
 */
import { getCollection } from "astro:content";

import { computePostStats } from "./compute-post-stats";

// 模块级缓存：整个构建周期只计算一次
let _cachedTotal: number | null = null;

/**
 * 获取所有文章的总字数
 * 通过 computePostStats 从原始 body 计算（替代旧 remark 插件注入）
 */
export async function getTotalWordCount(): Promise<number> {
    if (_cachedTotal !== null) return _cachedTotal;
    try {
        const posts = await getCollection("posts", ({ data }) => !data.draft);
        const results = await Promise.all(
            posts.map(async (post) => computePostStats(post.body || "").wordCount),
        );
        _cachedTotal = results.reduce((sum, w) => sum + w, 0);
        return _cachedTotal;
    } catch (error) {
        console.error("计算文章总字数时出错:", error);
        return 0;
    }
}

let _cachedDescriptions: Map<string, { desc: string; wordCount: number }> | null = null;

/**
 * 获取所有文章的描述和字数缓存，供 RSS/Atom/LLMs feed 共享
 */
export async function getPostDescriptions(): Promise<
    Map<string, { desc: string; wordCount: number }>
> {
    if (_cachedDescriptions !== null) return _cachedDescriptions;
    const posts = await getCollection("posts", ({ data }) => !data.draft);
    const results = await Promise.all(
        posts.map(async (post) => {
            const stats = computePostStats(post.body || "");
            return {
                id: String(post.data.abbrlink ?? post.id),
                desc: stats.desc || post.data.desc || "",
                wordCount: stats.wordCount,
            };
        }),
    );
    _cachedDescriptions = new Map(
        results.map((r) => [r.id, { desc: r.desc, wordCount: r.wordCount }]),
    );
    return _cachedDescriptions;
}

export function formatWordCount(count: number): string {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
}
