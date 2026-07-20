/**
 * 搜索同义词扩展 — 构建时基于文章内容 TF-IDF + 词汇共现自动生成。
 *
 * 原理：
 * 1. 用 Intl.Segmenter（与 Orama mandarin tokenizer 相同引擎）分词
 * 2. 计算 TF-IDF，提取每篇文章的前 N 个特征词
 * 3. 构建词汇共现图：在同一篇文章中共同出现的词，互相关联
 * 4. 输出每个词的 top K 个相关词作为同义词
 *
 * 用户搜索 "算法" → 自动扩展为 "算法 复杂度 排序 数据结构"，
 * Orama 匹配任意 token，实现内容感知的语义扩展，零维护。
 */

import type { SearchDoc } from "./search-schema";

const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });

/** 分词并过滤短词/标点/数字/噪音 */
function tokenize(text: string): string[] {
    if (!text) return [];
    const tokens: string[] = [];
    for (const seg of segmenter.segment(text)) {
        if (!seg.isWordLike) continue;
        const w = seg.segment;
        // 过滤：长度不足、纯数字、LaTeX/HTML/URL 噪音
        if (w.length < 2) continue;
        if (/^\d+$/.test(w)) continue;
        if (/[\\{}_<>:/]/.test(w)) continue;
        tokens.push(w);
    }
    return tokens;
}

/** 通用中英文停用词 */
const STOP_WORDS = new Set([
    // 中文
    "可以",
    "没有",
    "这个",
    "一个",
    "使用",
    "通过",
    "进行",
    "需要",
    "问题",
    "对于",
    "我们",
    "他们",
    "一些",
    "什么",
    "如果",
    "因为",
    "所以",
    "但是",
    "然后",
    "或者",
    "以及",
    "而且",
    "不是",
    "就是",
    "已经",
    "还是",
    "只是",
    "一种",
    "不会",
    "可能",
    "能够",
    "应该",
    "这里",
    "那里",
    "其中",
    "之后",
    "之前",
    "时候",
    "自己",
    "知道",
    "文章",
    "内容",
    "部分",
    "方式",
    "方法",
    "情况",
    "作用",
    "不同",
    "介绍",
    "说明",
    "关于",
    "主要",
    "包括",
    "如何",
    "本文",
    // 英文
    "the",
    "is",
    "are",
    "was",
    "were",
    "and",
    "or",
    "not",
    "but",
    "for",
    "with",
    "this",
    "that",
    "from",
    "have",
    "has",
    "been",
    "will",
    "can",
    "are",
    "its",
    "also",
    "into",
    "such",
    "than",
    "then",
    "when",
    "where",
    "which",
    "what",
    "who",
    "how",
    "all",
    "each",
    "both",
    "few",
    "more",
    "most",
    "other",
    "some",
    "only",
    "very",
    "just",
    "about",
    "over",
    "after",
    "before",
    "between",
]);

/** 最大共现矩阵尺寸（控制内存和输出体积） */
const MAX_TERMS = 500;
/** 每个词保留的同义词数量 */
const TOP_K = 8;

export function buildSynonyms(docs: SearchDoc[]): Record<string, string[]> {
    if (docs.length === 0) return {};

    // === 第 1 步：分词 + TF 统计 ===
    const docTokens: Map<number, Map<string, number>> = new Map();
    const df = new Map<string, number>(); // document frequency

    for (let i = 0; i < docs.length; i++) {
        const text = [docs[i].title, docs[i].description, docs[i].content]
            .filter(Boolean)
            .join(" ");
        const tokens = tokenize(text);
        const tf = new Map<string, number>();
        const seen = new Set<string>();

        for (const t of tokens) {
            if (STOP_WORDS.has(t)) continue;
            tf.set(t, (tf.get(t) || 0) + 1);
            if (!seen.has(t)) {
                df.set(t, (df.get(t) || 0) + 1);
                seen.add(t);
            }
        }

        if (tf.size > 0) docTokens.set(i, tf);
    }

    const N = docs.length;

    // === 第 2 步：TF-IDF，每篇文章取 top 15 特征词 ===
    const docKeywords: string[][] = [];
    for (let i = 0; i < docs.length; i++) {
        const tf = docTokens.get(i);
        if (!tf) {
            docKeywords.push([]);
            continue;
        }

        const scored: Array<[string, number]> = [];
        for (const [term, freq] of tf) {
            const idf = Math.log((N + 1) / ((df.get(term) || 0) + 1));
            scored.push([term, freq * idf]);
        }
        scored.sort((a, b) => b[1] - a[1]);
        docKeywords.push(scored.slice(0, 15).map(([t]) => t));
    }

    // === 第 3 步：计算词汇共现矩阵 ===
    const cooc = new Map<string, Map<string, number>>();

    for (const keywords of docKeywords) {
        for (let i = 0; i < keywords.length; i++) {
            for (let j = 0; j < keywords.length; j++) {
                if (i === j) continue;
                const a = keywords[i],
                    b = keywords[j];
                if (!cooc.has(a)) cooc.set(a, new Map());
                const inner = cooc.get(a)!;
                inner.set(b, (inner.get(b) || 0) + 1);
            }
        }
    }

    // === 第 4 步：取共现次数最高的 TOP_K 个词作为同义词 ===
    const result: Record<string, string[]> = {};

    // 只保留高频词（按 DF 排序取 top MAX_TERMS）
    const sortedTerms = [...cooc.keys()]
        .sort((a, b) => (df.get(b) || 0) - (df.get(a) || 0))
        .slice(0, MAX_TERMS);

    for (const term of sortedTerms) {
        const related = cooc.get(term);
        if (!related) continue;

        const ranked = [...related.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, TOP_K)
            .map(([t]) => t);

        if (ranked.length > 0) {
            result[term] = ranked;
        }
    }

    return result;
}

/**
 * 将用户搜索词扩展为包含同义词的搜索字符串。
 */
export function expandQuery(query: string, synonyms: Record<string, string[]>): string {
    const tokens = query.split(/[\s,，。；;、]+/).filter(Boolean);
    const expanded = new Set<string>();

    for (const token of tokens) {
        expanded.add(token);
        const candidates = synonyms[token];
        if (candidates) {
            for (const s of candidates) {
                expanded.add(s);
            }
        }
    }

    return [...expanded].join(" ");
}
