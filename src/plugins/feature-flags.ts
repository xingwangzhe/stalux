import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import { splitToWords } from "@echogarden/text-segmentation";
import jsTokens from "js-tokens";
/**
 * Sätteri 插件：在构建时完成字数统计和特性标记，
 * 只从 Sätteri 的 MDAST/HAST 节点读取信息，并通过 ctx 注入最终结果。
 *
 * 字数统计策略：
 * - 统计 paragraph、heading 和 tableCell，覆盖列表、引用、表格等正文。
 * - 独立的 code 块、math/displayMath 公式不参与正文词数统计。
 * - 行内 code 参与正文统计，inlineMath 单独计入公式阅读成本。
 *
 * 特性标记：
 * - HAST 阶段 <img> 检测      → hasImage
 * - mermaid 处理交由 @xingwangzhe/satteri-mermaid 的 mdast + hast 插件
 * - 数学公式由 satteri-temml 插件直接输出 MathML，无需额外标记
 */
import { defineMdastPlugin, defineHastPlugin } from "satteri";

const WORDS_PER_MINUTE = 400;
const CODE_SECONDS_PER_NON_EMPTY_LINE = 2;
const INLINE_MATH_BASE_SECONDS = 1;
const DISPLAY_MATH_BASE_SECONDS = 4;
const MATH_SECONDS_PER_NON_WHITESPACE_CHARACTER = 0.03;

type FeatureFlagsState = {
    proseText: string;
    codeTokens: number;
    codeCharacters: number;
    codeNonEmptyLines: number;
    codeBlocks: number;
    inlineMathBlocks: number;
    displayMathBlocks: number;
    mathCharacters: number;
    mathNonWhitespaceCharacters: number;
    hasImage: boolean;
};

function getState(ctx: any): FeatureFlagsState {
    const data = ctx.data as Record<string, unknown>;
    return (data.staluxFeatureFlags ??= {
        proseText: "",
        codeTokens: 0,
        codeCharacters: 0,
        codeNonEmptyLines: 0,
        codeBlocks: 0,
        inlineMathBlocks: 0,
        displayMathBlocks: 0,
        mathCharacters: 0,
        mathNonWhitespaceCharacters: 0,
        hasImage: false,
    }) as FeatureFlagsState;
}

function injectState(ctx: any) {
    const state = getState(ctx);
    const injected = ctx.data.astro.frontmatter as Record<string, unknown>;
    injected.proseText = state.proseText;
    injected.codeTokens = state.codeTokens;
    injected.codeCharacters = state.codeCharacters;
    injected.codeNonEmptyLines = state.codeNonEmptyLines;
    injected.codeBlocks = state.codeBlocks;
    injected.inlineMathBlocks = state.inlineMathBlocks;
    injected.displayMathBlocks = state.displayMathBlocks;
    injected.mathCharacters = state.mathCharacters;
    injected.mathNonWhitespaceCharacters = state.mathNonWhitespaceCharacters;
    injected.hasImage = state.hasImage;
}

function countCodeTokens(value: string, lang?: string): number {
    if (/^(?:js|jsx|javascript|ts|tsx|typescript)$/.test(lang ?? "")) {
        return Array.from(jsTokens(value, { jsx: /jsx|tsx/.test(lang ?? "") })).filter(
            (token) =>
                ![
                    "WhiteSpace",
                    "LineTerminatorSequence",
                    "MultiLineComment",
                    "SingleLineComment",
                    "HashbangComment",
                ].includes(token.type),
        ).length;
    }
    return value.match(/\p{L}[\p{L}\p{N}_]*|\p{N}+(?:\.\p{N}+)?|[^\s]/gu)?.length ?? 0;
}

function countMath(node: any, ctx: any, display: boolean) {
    const state = getState(ctx);
    const value = String(node.value ?? "");
    if (display) state.displayMathBlocks++;
    else state.inlineMathBlocks++;
    state.mathCharacters += [...value].length;
    state.mathNonWhitespaceCharacters += (value.match(/\S/gu) ?? []).length;
    injectState(ctx);
}

function collectProseNodeText(node: any): string {
    if (node.type === "inlineMath" || node.type === "math" || node.type === "code") {
        return "";
    }
    if (node.type === "text" || node.type === "inlineCode") {
        return node.value ?? "";
    }
    return Array.isArray(node.children) ? node.children.map(collectProseNodeText).join(" ") : "";
}

export const featureFlagsMdast = defineMdastPlugin({
    name: "feature-flags-mdast",

    code(node, ctx) {
        const state = getState(ctx);
        state.codeBlocks++;
        state.codeCharacters += [...node.value].length;
        state.codeNonEmptyLines += node.value
            .split(/\r?\n/u)
            .filter((line) => /\S/u.test(line)).length;
        state.codeTokens += countCodeTokens(node.value, node.lang);
        injectState(ctx);
    },

    math(node, ctx) {
        countMath(node, ctx, true);
    },

    inlineMath(node, ctx) {
        countMath(node, ctx, false);
    },

    heading(node, ctx) {
        getState(ctx).proseText += ` ${collectProseNodeText(node)}`;
        injectState(ctx);
    },

    paragraph(node, ctx) {
        getState(ctx).proseText += ` ${collectProseNodeText(node)}`;
        injectState(ctx);
    },

    tableCell(node, ctx) {
        getState(ctx).proseText += ` ${collectProseNodeText(node)}`;
        injectState(ctx);
    },
});

/**
 * HAST 插件：检测图片，写入 frontmatter，并添加懒加载属性
 */
export const featureFlagsHast = defineHastPlugin({
    name: "feature-flags-hast",

    element: {
        filter: ["img"],
        visit(node, ctx) {
            const state = getState(ctx);
            state.hasImage = true;
            (ctx.data.astro.frontmatter as Record<string, unknown>).hasImage = true;
            // 第一张正文图片可能成为 LCP，优先加载；其余图片延迟加载。
            const data = ctx.data as Record<string, unknown>;
            const firstImage = !data.staluxFirstImageSeen;
            data.staluxFirstImageSeen = true;
            if (!node.properties?.loading) {
                ctx.setProperty(node, "loading", firstImage ? "eager" : "lazy");
            }
            if (!node.properties?.decoding) {
                ctx.setProperty(node, "decoding", "async");
            }
            if (firstImage && !node.properties?.fetchpriority) {
                ctx.setProperty(node, "fetchpriority", "high");
            }
        },
    },
});

/**
 * 直接用 Sätteri AST 分析一篇文章，供文章页、全局统计和 API 复用。
 * 这里不复用内容集合的 data，也不读取 Astro 的渲染 metadata。
 */
export async function analyzeFeatureFlags(body: string | undefined): Promise<{
    hasImage: boolean;
    readingMinutes: number;
    wordCount: number;
}> {
    const processor = await createSatteriMarkdownProcessor({
        mdastPlugins: [featureFlagsMdast],
        hastPlugins: [featureFlagsHast],
        features: { math: true },
    });
    const result = await processor.render(body ?? "");
    const metadata = result.metadata.frontmatter as Record<string, unknown>;
    const proseWords = (
        await splitToWords(String(metadata.proseText ?? ""))
    ).nonPunctuationEntries.filter((entry) => /\S/u.test(entry.text)).length;
    const codeNonEmptyLines = Number(metadata.codeNonEmptyLines ?? 0);
    const inlineMathBlocks = Number(metadata.inlineMathBlocks ?? 0);
    const displayMathBlocks = Number(metadata.displayMathBlocks ?? 0);
    const mathNonWhitespaceCharacters = Number(metadata.mathNonWhitespaceCharacters ?? 0);
    return {
        hasImage: metadata.hasImage === true,
        readingMinutes: Math.ceil(
            proseWords / WORDS_PER_MINUTE +
                (codeNonEmptyLines * CODE_SECONDS_PER_NON_EMPTY_LINE +
                    inlineMathBlocks * INLINE_MATH_BASE_SECONDS +
                    displayMathBlocks * DISPLAY_MATH_BASE_SECONDS +
                    mathNonWhitespaceCharacters * MATH_SECONDS_PER_NON_WHITESPACE_CHARACTER) /
                    60,
        ),
        wordCount: proseWords,
    };
}
