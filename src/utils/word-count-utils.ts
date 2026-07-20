/**
 * 站点字数统计工具
 *
 * Astro 7.1 启用 deferRender 后，post.rendered 不再在 content sync 阶段预计算。
 * 因此改为直接从 post.body（原始 markdown）统计字数，不再依赖 Sätteri 的渲染结果。
 */
import { getCollection } from "astro:content";

// ---------------------------------------------------------------------------
// 字数统计算法（基于 W3C Intl.Segmenter，body-based）
// ---------------------------------------------------------------------------

const bodySegmenter = new Intl.Segmenter("zh", { granularity: "word" });

/**
 * 从原始 markdown 正文估算字数。
 * - 中文：`Intl.Segmenter` 逐字分割，每个汉字计 1
 * - 英文：按词计 1
 * - 纯数字序列：不计入（与旧正则行为一致）
 * - 标点/空白不计
 */
function countWordsFromBody(body: string | undefined | null): number {
    if (!body) return 0;
    let count = 0;
    for (const { segment, isWordLike } of bodySegmenter.segment(body)) {
        // 排除纯数字序列（如年份、代码行号等），与旧正则行为保持一致
        if (isWordLike && !/^\d+$/.test(segment)) count++;
    }
    return count;
}

// ---------------------------------------------------------------------------
// 模块级缓存（整个构建周期只计算一次）
// ---------------------------------------------------------------------------

let _cachedTotal: number | null = null;

/**
 * 获取所有已发布文章的总字数（从 body 估算）。
 * 结果会被缓存，同一构建周期内重复调用不会重新计算。
 */
export async function getTotalWordCount(): Promise<number> {
    if (_cachedTotal !== null) return _cachedTotal;
    try {
        const posts = await getCollection("posts", ({ data }) => !data.draft);
        _cachedTotal = posts.reduce((sum, post) => sum + countWordsFromBody(post.body), 0);
        return _cachedTotal;
    } catch (error) {
        console.error("计算文章总字数时出错:", error);
        return 0;
    }
}

let _cachedDescriptions: Map<string, { desc: string; wordCount: number }> | null = null;

/**
 * 获取所有已发布文章的描述和字数缓存，供 RSS/Atom/LLMs feed 共享。
 * - desc   ：直接从 frontmatter 读取（post.data.desc）
 * - wordCount：从 post.body 估算
 */
export async function getPostDescriptions(): Promise<
    Map<string, { desc: string; wordCount: number }>
> {
    if (_cachedDescriptions !== null) return _cachedDescriptions;
    const posts = await getCollection("posts", ({ data }) => !data.draft);
    const results = posts.map((post) => ({
        id: String(post.data.abbrlink ?? post.id),
        desc: post.data.desc || "",
        wordCount: countWordsFromBody(post.body),
    }));
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
