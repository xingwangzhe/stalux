/**
 * Sätteri 插件：在构建时完成字数统计和特性标记，
 * 通过 ctx.data.astro.frontmatter 把最终结果传递到 frontmatter，运行时无需再算。
 *
 * 字数统计策略：
 * - 只数 heading 和 paragraph 的内容（用 ctx.textContent 获取纯文本）。
 * - 独立的 code 块、math/displayMath 公式不参与计数
 *   （代码是"看"不是"读"，符号表达式不按词计）。
 * - 行内 code 和行内 math 会被 textContent(paragraph) 自然包含。
 *
 * 特性标记：
 * - HAST 阶段 <img> 检测      → hasImage
 * - mermaid 处理交由 @xingwangzhe/satteri-mermaid 的 mdast + hast 插件
 * - 数学公式由 satteri-temml 插件直接输出 MathML，无需额外标记
 */
import { defineMdastPlugin, defineHastPlugin } from "satteri";

import { countWords } from "../utils/count-words.ts";
import { setSearchText } from "../utils/search-data.ts";

const WORDS_PER_MINUTE = 400;

/** 从纯文本统计字数并累加到 frontmatter。 */
function flushWordCount(ctx: any, text: string) {
    const prev = (ctx.data.astro.frontmatter.wordCount as number) ?? 0;
    const wc = prev + countWords(text);
    const fm = ctx.data.astro.frontmatter;
    fm.wordCount = wc;
    fm.readingMinutes = Math.ceil(wc / WORDS_PER_MINUTE);
    // 搜索全文：拼接所有 heading + paragraph 的纯文本，供搜索索引用
    fm.searchText = ((fm.searchText as string) || "") + " " + text;
    // 写入共享 store，search-index 构建时直接读取，无需 render()
    if (fm.abbrlink) setSearchText(String(fm.abbrlink), fm.searchText as string);
}

export const featureFlagsMdast = defineMdastPlugin({
    name: "feature-flags-mdast",

    code(_node, _ctx) {
        // 独立的 code 块不参与字数统计
    },

    heading(node, ctx) {
        flushWordCount(ctx, ctx.textContent(node));
    },

    paragraph(node, ctx) {
        flushWordCount(ctx, ctx.textContent(node));
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
            ctx.data.astro.frontmatter.hasImage = true;
            // 添加懒加载和异步解码（封面图不在此处理，由 postCard.astro 控制）
            if (!node.properties?.loading) {
                ctx.setProperty(node, "loading", "lazy");
            }
            if (!node.properties?.decoding) {
                ctx.setProperty(node, "decoding", "async");
            }
        },
    },
});
