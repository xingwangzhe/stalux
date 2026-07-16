/**
 * Sätteri 插件：在构建时完成所有计算（字数、阅读时间、特性标记），
 * 通过 ctx.data.astro.frontmatter 把最终结果传递到 frontmatter，运行时无需再算。
 *
 * 状态传递说明：
 * - MDAST 阶段的 text / inlineCode / code / math 会把纯文本片段累积到
 *   ctx.data.__textParts 数组里；
 * - heading / paragraph 节点结束时调用 flushWordCount 把累积片段合并、
 *   统计字数并写入 frontmatter（原逻辑不在 flush 后清空 __textParts，
 *   处理顺序与上游保持一致，这里保持不变）；
 * - mermaid 代码块先被抽成 rawHtml 占位（携带随机 id），在 HAST 阶段
 *   再依据 ctx.data[MERMAID_CODES_KEY] 还原为真实代码。
 */
import { defineMdastPlugin, defineHastPlugin } from "satteri";

import { countWords } from "../utils/count-words";

const MERMAID_CODES_KEY = "__satteri_mermaid_codes";
const WORDS_PER_MINUTE = 400;

/** 向上取整得到阅读分钟数（至少 1 分钟）。 */
function ceilMinutes(words: number, wordsPerMinute: number): number {
    return Math.max(1, Math.ceil(words / wordsPerMinute));
}

function formatReadingTime(words: number, wordsPerMinute: number): string {
    const minutes = ceilMinutes(words, wordsPerMinute);
    if (minutes < 1) return "小于 1 分钟";
    return `${minutes} 分钟`;
}

// heading 与 paragraph 的收尾逻辑完全一致，统一到此处避免重复。
function flushWordCount(ctx: any) {
    const parts = ctx.data.__textParts as string[] | undefined;
    if (!parts || parts.length === 0) return;

    const plainText = parts.join(" ");
    const wc = countWords(plainText);
    const fm = ctx.data.astro.frontmatter;
    fm.wordCount = wc;
    fm.minutesRead = formatReadingTime(wc, WORDS_PER_MINUTE);
    fm.readingMinutes = ceilMinutes(wc, WORDS_PER_MINUTE);
}

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
        flushWordCount(ctx);
    },

    paragraph(_node, ctx) {
        flushWordCount(ctx);
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
