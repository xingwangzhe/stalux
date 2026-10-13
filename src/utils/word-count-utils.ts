/**
 * 站点字数统计工具
 *
 * Astro 7.1 启用 deferRender 后，post.rendered 不再在 content sync 阶段预计算。
 * 因此统一通过 Sätteri AST 分析 post.body，确保各出口使用同一套结果。
 */
import { getCollection } from "astro:content";
import { analyzeFeatureFlags } from "@plugins/feature-flags";
import type { AstroRuntimeLogger } from "astro";
import { forEachBounded } from "../internal/bounded-tasks";
import { logDetail, logFailure } from "./diagnostics";

// ---------------------------------------------------------------------------
// 模块级缓存（整个构建周期只计算一次）
// ---------------------------------------------------------------------------

interface PostStatistics {
    total: number;
    descriptions: Map<string, { desc: string; wordCount: number }>;
}

let statisticsPromise: Promise<PostStatistics> | undefined;

function loadStatistics(logger?: AstroRuntimeLogger): Promise<PostStatistics> {
    if (!statisticsPromise) {
        statisticsPromise = (async () => {
            const posts = await getCollection("posts", ({ data }) => !data.draft);
            const results = new Array<{ id: string; desc: string; wordCount: number }>(
                posts.length,
            );
            await forEachBounded(
                posts.map((post, index) => ({ post, index })),
                4,
                async ({ post, index }) => {
                    results[index] = {
                        id: String(post.data.abbrlink ?? post.id),
                        desc: post.data.desc || "",
                        wordCount: (await analyzeFeatureFlags(post.body, logger)).wordCount,
                    };
                },
            );
            const descriptions = new Map<string, { desc: string; wordCount: number }>();
            let total = 0;
            for (const result of results) {
                total += result.wordCount;
                descriptions.set(result.id, { desc: result.desc, wordCount: result.wordCount });
            }
            logDetail(logger, "word-count", `analyzed ${posts.length} posts`);
            return { total, descriptions };
        })().catch((error: unknown) => {
            statisticsPromise = undefined;
            throw error;
        });
    }
    return statisticsPromise;
}

/** Shared in-flight statistics prevent concurrent pages from repeating collection work. */
export async function getTotalWordCount(logger?: AstroRuntimeLogger): Promise<number> {
    try {
        return (await loadStatistics(logger)).total;
    } catch (error) {
        logFailure(logger, "word-count", "total calculation failed; returning zero", error);
        return 0;
    }
}

/** Keep collection insertion order and frontmatter descriptions unchanged. */
export async function getPostDescriptions(
    logger?: AstroRuntimeLogger,
): Promise<Map<string, { desc: string; wordCount: number }>> {
    return (await loadStatistics(logger)).descriptions;
}

export function formatWordCount(count: number, lang?: string): string {
    const isZh = lang?.startsWith("zh");
    // 中文用"万"做万级单位；其他语言统一用"k"（千）。
    if (isZh && count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return String(count);
}
