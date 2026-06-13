/**
 * rehype-temml — 将 remark-math 产生的 math/inlineMath 节点转换为 MathML
 * 替代 rehype-katex，使用浏览器原生 MathML 渲染，bundle 体积减小 40%
 */
import { visit } from "unist-util-visit";
import temml from "temml";

export default function rehypeTemml(options: Record<string, unknown> = {}) {
    return (tree: any) => {
        visit(tree, (node: any, index: number | null, parent: any | null) => {
            if (!node || !parent || typeof index !== "number") return;

            // 行内公式: span.math-inline
            if (
                node.type === "element" &&
                node.tagName === "span" &&
                Array.isArray(node.properties?.className) &&
                node.properties.className.includes("math-inline")
            ) {
                const tex = (node.children?.[0]?.value || "").trim();
                if (!tex) return;
                try {
                    const html = temml.renderToString(tex, {
                        displayMode: false,
                        ...options,
                    });
                    parent.children[index] = { type: "raw", value: html };
                } catch (_) {
                    /* 渲染失败时保留原始 TeX */
                }
            }

            // 块级公式: div.math-display
            if (
                node.type === "element" &&
                node.tagName === "div" &&
                Array.isArray(node.properties?.className) &&
                node.properties.className.includes("math-display")
            ) {
                const tex = (node.children?.[0]?.value || "").trim();
                if (!tex) return;
                try {
                    const html = temml.renderToString(tex, {
                        displayMode: true,
                        ...options,
                    });
                    parent.children[index] = { type: "raw", value: html };
                } catch (_) {
                    /* 渲染失败时保留原始 TeX */
                }
            }
        });
    };
}
