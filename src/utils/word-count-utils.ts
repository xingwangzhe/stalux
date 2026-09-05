/**
 * 站点字数统计工具
 *
 * Astro 7.1 启用 deferRender 后，post.rendered 不再在 content sync 阶段预计算。
 * 因此统一通过 Sätteri AST 分析 post.body，确保各出口使用同一套结果。
 */
import { getCollection } from "astro:content";
import { analyzeFeatureFlags } from "@plugins/feature-flags";
import type { AstroRuntimeLogger } from "astro";
import { logDetail, logFailure } from "./diagnostics";

// ---------------------------------------------------------------------------
// 模块级缓存（整个构建周期只计算一次）
// ---------------------------------------------------------------------------

let _cachedTotal: number | null = null;

/**
 * 获取所有已发布文章的总字数（从 body 估算）。
 * 结果会被缓存，同一构建周期内重复调用不会重新计算。
 */
export async function getTotalWordCount(logger?: AstroRuntimeLogger): Promise<number> {
    if (_cachedTotal !== null) {
        logDetail(logger, "word-count", "total cache hit");
        return _cachedTotal;
    }
    logDetail(logger, "word-count", "total cache miss");
    try {
        const posts = await getCollection("posts", ({ data }) => !data.draft);
        const results = await Promise.all(
            posts.map((post) => analyzeFeatureFlags(post.body, logger)),
        );
        _cachedTotal = results.reduce((sum, result) => sum + result.wordCount, 0);
        logDetail(logger, "word-count", `analyzed ${posts.length} posts`);
        return _cachedTotal;
    } catch (error) {
        logFailure(logger, "word-count", "total calculation failed; returning zero", error);
        return 0;
    }
}

let _cachedDescriptions: Map<string, { desc: string; wordCount: number }> | null = null;

/**
 * 获取所有已发布文章的描述和字数缓存，供 RSS/Atom/LLMs feed 共享。
 * - desc   ：直接从 frontmatter 读取（post.data.desc）
 * - wordCount：从 Sätteri AST 分析 post.body
 */
export async function getPostDescriptions(
    logger?: AstroRuntimeLogger,
): Promise<Map<string, { desc: string; wordCount: number }>> {
    if (_cachedDescriptions !== null) {
        logDetail(logger, "word-count", "description cache hit");
        return _cachedDescriptions;
    }
    logDetail(logger, "word-count", "description cache miss");
    const posts = await getCollection("posts", ({ data }) => !data.draft);
    const results = await Promise.all(
        posts.map(async (post) => ({
            id: String(post.data.abbrlink ?? post.id),
            desc: post.data.desc || "",
            wordCount: (await analyzeFeatureFlags(post.body, logger)).wordCount,
        })),
    );
    _cachedDescriptions = new Map(
        results.map((r) => [r.id, { desc: r.desc, wordCount: r.wordCount }]),
    );
    return _cachedDescriptions;
}

export function formatWordCount(count: number, lang?: string): string {
    const isZh = lang?.startsWith("zh");
    // 中文用"万"做万级单位；其他语言统一用"k"（千）。
    if (isZh && count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return String(count);
}
