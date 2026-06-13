/**
 * 站点字数统计工具
 */
import { getCollection, render } from "astro:content";

// 模块级缓存：整个构建周期只计算一次
let _cachedTotal: number | null = null;

/**
 * 获取所有文章的总字数
 * 注意：wordCount 是通过 remark 插件动态生成的虚拟 frontmatter，
 * 需要通过 render() 函数获取
 * 首调用计算并缓存，后续调用直接返回缓存值
 */
export async function getTotalWordCount(): Promise<number> {
    if (_cachedTotal !== null) {
        return _cachedTotal;
    }
    try {
        const posts = await getCollection("posts", ({ data }) => !data.draft);
        // Promise.all 并发渲染，替代串行 for...of
        const results = await Promise.all(
            posts.map(async (post) => {
                const { remarkPluginFrontmatter } = await render(post);
                return remarkPluginFrontmatter.wordCount || 0;
            }),
        );
        _cachedTotal = results.reduce((sum, w) => sum + w, 0);
        return _cachedTotal;
    } catch (error) {
        console.error("计算文章总字数时出错:", error);
        return 0;
    }
}

// 模块级缓存：存储每篇文章的 desc 和 wordCount
let _cachedDescriptions: Map<string, { desc: string; wordCount: number }> | null = null;

/**
 * 获取所有文章的描述和字数缓存
 * 首调用计算并缓存，后续调用直接返回
 * 供 RSS/Atom/LLMs feed 共享使用，避免每个 feed 各自遍历全部文章
 */
export async function getPostDescriptions(): Promise<
    Map<string, { desc: string; wordCount: number }>
> {
    if (_cachedDescriptions !== null) {
        return _cachedDescriptions;
    }
    const posts = await getCollection("posts", ({ data }) => !data.draft);
    const results = await Promise.all(
        posts.map(async (post) => {
            const { remarkPluginFrontmatter } = await render(post);
            return {
                id: String(post.data.abbrlink ?? post.id),
                desc: (remarkPluginFrontmatter.desc || post.data.desc || "") as string,
                wordCount: (remarkPluginFrontmatter.wordCount || 0) as number,
            };
        }),
    );
    _cachedDescriptions = new Map(
        results.map((r) => [r.id, { desc: r.desc, wordCount: r.wordCount }]),
    );
    return _cachedDescriptions;
}

/**
 * 格式化字数显示
 */
export function formatWordCount(count: number): string {
    if (count >= 10000) {
        return `${(count / 10000).toFixed(1)}万`;
    } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
}
