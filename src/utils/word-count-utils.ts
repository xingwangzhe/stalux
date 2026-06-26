/**
 * 站点字数统计工具
 * 现在字数统计由 Sätteri 插件在构建时完成，不再需要预解析
 */
import { getCollection } from "astro:content";

// 模块级缓存：整个构建周期只计算一次
let _cachedTotal: number | null = null;

/**
 * 获取所有文章的总字数
 * 从 remarkPluginFrontmatter.wordCount 读取（由 satteri 插件注入）
 */
export async function getTotalWordCount(): Promise<number> {
    if (_cachedTotal !== null) return _cachedTotal;
    try {
        const posts = await getCollection("posts", ({ data }) => !data.draft);
        const results = await Promise.all(
            posts.map(async (post) => {
                // 尝试从已渲染的 metadata 读取字数
                const rendered = (post as any).rendered;
                if (rendered?.metadata?.frontmatter?.wordCount != null) {
                    return rendered.metadata.frontmatter.wordCount;
                }
                return 0;
            }),
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
            const rendered = (post as any).rendered;
            const fm = rendered?.metadata?.frontmatter;
            return {
                id: String(post.data.abbrlink ?? post.id),
                desc: post.data.desc || "",
                wordCount: fm?.wordCount ?? 0,
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
