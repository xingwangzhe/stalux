/**
 * Sätteri 插件：在构建时完成字数统计和特性标记，
 * 通过 ctx.data.astro.frontmatter 把最终结果传递到 frontmatter，运行时无需再算。
 *
 * 字数统计策略：
 * - 只数 heading 和 paragraph 的内容（用 ctx.textContent 获取纯文本）。
 * - 独立的 code 块、math/displayMath 公式、mermaid 图表不参与计数
 *   （代码是"看"不是"读"，符号表达式不按词计）。
 * - 行内 code 和行内 math 会被 textContent(paragraph) 自然包含。
 *
 * 特性标记：
 * - math / inlineMath        → hasKatex
 * - code(lang=mermaid)        → hasMermaid + rawHtml 占位
 * - HAST 阶段 <img> 检测      → hasImage
 */
import { defineMdastPlugin, defineHastPlugin } from "satteri";

import { countWords } from "../utils/count-words";

const MERMAID_CODES_KEY = "__satteri_mermaid_codes";
const WORDS_PER_MINUTE = 400;

/** 从纯文本统计字数并累加到 frontmatter。 */
function flushWordCount(ctx: any, text: string) {
    const prev = (ctx.data.astro.frontmatter.wordCount as number) ?? 0;
    const wc = prev + countWords(text);
    const fm = ctx.data.astro.frontmatter;
    fm.wordCount = wc;
    // readingMinutes 不含硬编码中文——UI 侧通过 i18n（common.minute / common.lessThanOneMinute）展示
    fm.readingMinutes = Math.ceil(wc / WORDS_PER_MINUTE);
}

export const featureFlagsMdast = defineMdastPlugin({
    name: "feature-flags-mdast",

    math(_node, ctx) {
        ctx.data.astro.frontmatter.hasKatex = true;
    },

    inlineMath(_node, ctx) {
        ctx.data.astro.frontmatter.hasKatex = true;
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
        // 非 mermaid 的独立 code 块不参与字数统计
    },

    heading(node, ctx) {
        flushWordCount(ctx, ctx.textContent(node));
    },

    paragraph(node, ctx) {
        flushWordCount(ctx, ctx.textContent(node));
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
