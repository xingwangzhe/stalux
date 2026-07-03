/**
 * Sätteri 插件：通过 ctx.data.astro.frontmatter 传递 feature flags 和字数统计
 * 在构建时完成所有计算，只传递最终结果到 frontmatter
 */
import { defineMdastPlugin, defineHastPlugin } from "satteri";
import wordCount from "word-count";

const MERMAID_CODES_KEY = "__satteri_mermaid_codes";

function countWords(text: string): number {
    return wordCount(text);
}

function formatReadingTime(words: number, wordsPerMinute: number): string {
    const minutes = Math.ceil(words / wordsPerMinute);
    if (minutes < 1) return "小于 1 分钟";
    return `${minutes} 分钟`;
}

function getReadingMinutes(words: number, wordsPerMinute: number): number {
    return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * MDAST 插件：检测 math/mermaid，收集纯文本并计算字数统计
 * 使用 ctx.data 存储文本片段，在 heading/paragraph 处触发计算
 */
export const featureFlagsMdast = defineMdastPlugin({
    name: "feature-flags-mdast",

    text(node, ctx) {
        const parts = (ctx.data.__textParts ??= []) as string[];
        parts.push(node.value);
    },

    inlineCode(node, ctx) {
        const parts = (ctx.data.__textParts ??= []) as string[];
        parts.push(node.value);
    },

    math(node, ctx) {
        ctx.data.astro.frontmatter.hasKatex = true;
        const parts = (ctx.data.__textParts ??= []) as string[];
        parts.push(node.value);
    },

    inlineMath(node, ctx) {
        ctx.data.astro.frontmatter.hasKatex = true;
        const parts = (ctx.data.__textParts ??= []) as string[];
        parts.push(node.value);
    },

    code(node, ctx) {
        if (node.lang === "mermaid") {
            ctx.data.astro.frontmatter.hasMermaid = true;

            const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
            const codes = (ctx.data[MERMAID_CODES_KEY] ??= {});
            (codes as Record<string, string>)[id] = node.value;

            return {
                rawHtml: `<pre class="mermaid" data-mermaid-id="${id}"></pre>`,
            } as any;
        }
        const parts = (ctx.data.__textParts ??= []) as string[];
        parts.push(node.value);
    },

    heading(_node, ctx) {
        const parts = ctx.data.__textParts as string[] | undefined;
        if (!parts || parts.length === 0) return;

        const plainText = parts.join(" ");
        const wc = countWords(plainText);
        const fm = ctx.data.astro.frontmatter;
        fm.wordCount = wc;
        fm.minutesRead = formatReadingTime(wc, 400);
        fm.readingMinutes = getReadingMinutes(wc, 400);
    },

    paragraph(_node, ctx) {
        const parts = ctx.data.__textParts as string[] | undefined;
        if (!parts || parts.length === 0) return;

        const plainText = parts.join(" ");
        const wc = countWords(plainText);
        const fm = ctx.data.astro.frontmatter;
        fm.wordCount = wc;
        fm.minutesRead = formatReadingTime(wc, 400);
        fm.readingMinutes = getReadingMinutes(wc, 400);
    },
});

/**
 * HAST 插件：检测图片，写入 frontmatter
 */
export const featureFlagsHast = defineHastPlugin({
    name: "feature-flags-hast",

    element: {
        filter: ["img"],
        visit(_node, ctx) {
            ctx.data.astro.frontmatter.hasImage = true;
        },
    },
});

/**
 * HAST 插件：还原 mermaid 代码块
 */
export const mermaidHast = defineHastPlugin({
    name: "mermaid-hast-restore",

    raw(node, ctx) {
        const match = node.value.match(/^<pre class="mermaid" data-mermaid-id="([^"]+)"><\/pre>$/);
        if (!match) return;

        const id = match[1];
        const code = (ctx.data[MERMAID_CODES_KEY] as Record<string, string>)?.[id];
        if (!code) return;

        ctx.replaceNode(node, {
            type: "element",
            tagName: "pre",
            properties: { className: ["mermaid"] },
            children: [{ type: "text", value: code }],
        });
    },
});
