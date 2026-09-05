import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import type { AstroRuntimeLogger } from "astro";
import type { HastVisitorContext, MdastNode, MdastVisitorContext } from "satteri";
/**
 * Sätteri 插件：在构建时完成字数统计和特性标记，
 * 只从 Sätteri 的 MDAST/HAST 节点读取信息，并通过 ctx 注入最终结果。
 *
 * 字数统计策略：
 * - 统计 paragraph、heading 和 tableCell，覆盖列表、引用、表格等正文。
 * - 行内 code 属于正文；独立 code、math/displayMath 由各自 lexer 统计。
 * - 代码和数学公式都计入最终 wordCount，同时保留结构化阅读成本字段。
 *
 * 特性标记：
 * - HAST 阶段 <img> 检测      → hasImage
 * - mermaid 处理交由 @xingwangzhe/satteri-mermaid 的 mdast + hast 插件
 * - 数学公式由 satteri-temml 插件直接输出 MathML，无需额外标记
 */
import { defineHastPlugin, defineMdastPlugin } from "satteri";
import { logDetail } from "../utils/diagnostics";

declare module "satteri" {
    interface DataMap {
        staluxFeatureFlags?: FeatureFlagsState;
        staluxFirstImageSeen?: boolean;
    }
}

const WORDS_PER_MINUTE = 400;
const CODE_SECONDS_PER_NON_EMPTY_LINE = 2;
const INLINE_MATH_BASE_SECONDS = 1;
const DISPLAY_MATH_BASE_SECONDS = 4;
const MATH_SECONDS_PER_NON_WHITESPACE_CHARACTER = 0.03;
const CODE_SECONDS_PER_TOKEN = 0.12;
const MATH_SECONDS_PER_TOKEN = 0.2;
const proseSegmenter = new Intl.Segmenter("und", { granularity: "grapheme" });
const HAN_GRAPHEME = /^\p{Script=Han}$/u;
const LETTER_GRAPHEME = /^[\p{Letter}\p{Mark}]$/u;
const NUMBER_GRAPHEME = /^\p{Number}$/u;
const MATH_TOKEN = /\\[a-zA-Z]+|[a-zA-Z]+|\d+(?:\.\d+)?|[^\s{}]/gu;

type FeatureFlagsState = {
    proseText: string;
    codeTokens: number;
    codeWordCount: number;
    codeCharacters: number;
    codeNonEmptyLines: number;
    codeBlocks: number;
    inlineMathBlocks: number;
    displayMathBlocks: number;
    mathCharacters: number;
    mathNonWhitespaceCharacters: number;
    mathWordCount: number;
    hasImage: boolean;
};

type PluginContext = MdastVisitorContext | HastVisitorContext;

function getState(ctx: PluginContext): FeatureFlagsState {
    const existing = ctx.data.staluxFeatureFlags;
    if (existing) return existing;

    const state: FeatureFlagsState = {
        proseText: "",
        codeTokens: 0,
        codeWordCount: 0,
        codeCharacters: 0,
        codeNonEmptyLines: 0,
        codeBlocks: 0,
        inlineMathBlocks: 0,
        displayMathBlocks: 0,
        mathCharacters: 0,
        mathNonWhitespaceCharacters: 0,
        mathWordCount: 0,
        hasImage: false,
    };
    ctx.data.staluxFeatureFlags = state;
    return state;
}

function getFrontmatter(ctx: PluginContext): Record<string, unknown> {
    const astroData = ctx.data.astro;
    if (!astroData) throw new Error("Satteri did not provide Astro frontmatter data");
    return astroData.frontmatter;
}

function injectState(ctx: PluginContext) {
    const state = getState(ctx);
    const injected = getFrontmatter(ctx);
    injected.proseText = state.proseText;
    injected.codeTokens = state.codeTokens;
    injected.codeWordCount = state.codeWordCount;
    injected.codeCharacters = state.codeCharacters;
    injected.codeNonEmptyLines = state.codeNonEmptyLines;
    injected.codeBlocks = state.codeBlocks;
    injected.inlineMathBlocks = state.inlineMathBlocks;
    injected.displayMathBlocks = state.displayMathBlocks;
    injected.mathCharacters = state.mathCharacters;
    injected.mathNonWhitespaceCharacters = state.mathNonWhitespaceCharacters;
    injected.mathWordCount = state.mathWordCount;
    injected.hasImage = state.hasImage;
}

function countCodeTokens(value: string, lang?: string): number {
    // 统计阶段不依赖语法高亮器：移除注释后，按标识符、数字、字符串和符号计数。
    // lang 保留在签名中，方便后续按语言增加规则，但当前规则对常见代码语言通用。
    void lang;
    const withoutComments = value.replace(/\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/gu, " ");
    return (
        withoutComments.match(
            /`(?:\\.|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\p{L}[\p{L}\p{N}_]*|\p{N}+(?:\.\p{N}+)?|[^\s]/gu,
        )?.length ?? 0
    );
}

function countProseWords(value: string): number {
    let count = 0;
    let inWord = false;
    let inNumber = false;

    for (const { segment } of proseSegmenter.segment(value)) {
        if (HAN_GRAPHEME.test(segment)) {
            count++;
            inWord = false;
            inNumber = false;
        } else if (LETTER_GRAPHEME.test(segment)) {
            if (!inWord) count++;
            inWord = true;
            inNumber = false;
        } else if (NUMBER_GRAPHEME.test(segment)) {
            if (!inNumber) count++;
            inNumber = true;
            inWord = false;
        } else {
            inWord = false;
            inNumber = false;
        }
    }

    return count;
}

function countMathTokens(value: string): number {
    return value.match(MATH_TOKEN)?.length ?? 0;
}

function countMath(node: { value: string }, ctx: MdastVisitorContext, display: boolean) {
    const state = getState(ctx);
    const value = String(node.value ?? "");
    if (display) state.displayMathBlocks++;
    else state.inlineMathBlocks++;
    state.mathCharacters += [...value].length;
    state.mathNonWhitespaceCharacters += (value.match(/\S/gu) ?? []).length;
    state.mathWordCount += countMathTokens(value);
    injectState(ctx);
}

function collectProseNodeText(node: Readonly<MdastNode>): string {
    if (node.type === "inlineMath" || node.type === "math" || node.type === "code") {
        return "";
    }
    if (node.type === "text" || node.type === "inlineCode") {
        return node.value;
    }
    return "children" in node && Array.isArray(node.children)
        ? node.children.map(collectProseNodeText).join(" ")
        : "";
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
        const codeTokens = countCodeTokens(node.value, node.lang ?? undefined);
        state.codeTokens += codeTokens;
        state.codeWordCount += codeTokens;
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
            getFrontmatter(ctx).hasImage = true;
            // 第一张正文图片可能成为 LCP，优先加载；其余图片延迟加载。
            const firstImage = !ctx.data.staluxFirstImageSeen;
            ctx.data.staluxFirstImageSeen = true;
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

type FeatureFlagsResult = {
    hasImage: boolean;
    readingMinutes: number;
    wordCount: number;
};

let processorPromise: ReturnType<typeof createSatteriMarkdownProcessor> | undefined;
const analysisCache = new Map<string, Promise<FeatureFlagsResult>>();

function getFeatureFlagsProcessor() {
    processorPromise ??= createSatteriMarkdownProcessor({
        mdastPlugins: [featureFlagsMdast],
        hastPlugins: [featureFlagsHast],
        features: { math: true },
    });
    return processorPromise;
}

/**
 * 直接用 Sätteri AST 分析一篇文章，供文章页、全局统计和 API 复用。
 * 这里不复用内容集合的 data，也不读取 Astro 的渲染 metadata。
 */
export function analyzeFeatureFlags(
    body: string | undefined,
    logger?: AstroRuntimeLogger,
): Promise<FeatureFlagsResult> {
    const content = body ?? "";
    const cached = analysisCache.get(content);
    if (cached) {
        logDetail(logger, "markdown-analysis", "cache hit");
        return cached;
    }
    logDetail(logger, "markdown-analysis", "cache miss; analyzing feature flags");

    const resultPromise = analyzeFeatureFlagsUncached(content);
    analysisCache.set(content, resultPromise);
    return resultPromise;
}

async function analyzeFeatureFlagsUncached(body: string): Promise<FeatureFlagsResult> {
    const processor = await getFeatureFlagsProcessor();
    const result = await processor.render(body ?? "");
    const metadata = result.metadata.frontmatter as Record<string, unknown>;
    const proseWords = countProseWords(String(metadata.proseText ?? ""));
    const codeWordCount = Number(metadata.codeWordCount ?? 0);
    const mathWordCount = Number(metadata.mathWordCount ?? 0);
    const codeNonEmptyLines = Number(metadata.codeNonEmptyLines ?? 0);
    const inlineMathBlocks = Number(metadata.inlineMathBlocks ?? 0);
    const displayMathBlocks = Number(metadata.displayMathBlocks ?? 0);
    const mathNonWhitespaceCharacters = Number(metadata.mathNonWhitespaceCharacters ?? 0);
    return {
        hasImage: metadata.hasImage === true,
        readingMinutes: Math.ceil(
            proseWords / WORDS_PER_MINUTE +
                (codeNonEmptyLines * CODE_SECONDS_PER_NON_EMPTY_LINE +
                    codeWordCount * CODE_SECONDS_PER_TOKEN +
                    inlineMathBlocks * INLINE_MATH_BASE_SECONDS +
                    displayMathBlocks * DISPLAY_MATH_BASE_SECONDS +
                    mathWordCount * MATH_SECONDS_PER_TOKEN +
                    mathNonWhitespaceCharacters * MATH_SECONDS_PER_NON_WHITESPACE_CHARACTER) /
                    60,
        ),
        wordCount: proseWords + codeWordCount + mathWordCount,
    };
}
