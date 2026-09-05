/**
 * Sätteri temml 插件 — 用 temml (TeX → MathML) 替代 KaTeX。
 *
 * 与 @nullpinter/satteri-katex 的接口兼容：
 * - math 节点 → { rawHtml: string }   (display math → <math display="block">)
 * - inlineMath 节点 → { type: "html", value: string }  (inline math → <math>)
 *
 * 输出纯 MathML，浏览器原生渲染，无需额外的 CSS/字体。
 */
import type { AstroIntegrationLogger } from "astro";

import { defineMdastPlugin, type MdastNode, type MdastVisitorContext } from "satteri";
import temmlLib, { type Options as TemmlOptions } from "temml";

const emptyOptions = {};

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

type MathNode = Extract<MdastNode, { type: "math" | "inlineMath" }>;

function renderTemmlError(value: string, error: unknown, options: TemmlOptions): string {
    const title = escapeHtml(String(error));
    const color = escapeHtml(options.errorColor ?? "#cc0000");
    return `<span class="temml-error" style="color:${color}" title="${title}">${escapeHtml(value)}</span>`;
}

function renderMath(
    node: Readonly<MathNode>,
    displayMode: boolean,
    options: TemmlOptions,
    ctx: MdastVisitorContext,
    logger?: AstroIntegrationLogger,
): string {
    const value = node.value;
    try {
        return temmlLib.renderToString(value, {
            ...options,
            displayMode,
            throwOnError: true,
        });
    } catch (error) {
        logger?.debug(
            "Temml render failed; reporting diagnostic through Markdown processor and trying tolerant rendering",
        );
        const cause = error instanceof Error ? error : new Error(String(error));
        ctx.report({
            message: `Could not render math with Temml: ${cause.message}`,
            node,
            severity: "error",
        });
        try {
            return temmlLib.renderToString(value, {
                ...options,
                displayMode,
                strict: false,
                throwOnError: false,
            });
        } catch {
            logger?.debug("Temml tolerant rendering failed; using error markup");
            return renderTemmlError(value, error, options);
        }
    }
}

/**
 * 创建一个 Sätteri temml mdast 插件。
 * @param options - 透传给 temml.renderToString 的选项（displayMode 除外）
 */
export function temml(options?: TemmlOptions, logger?: AstroIntegrationLogger) {
    const settings = options ?? emptyOptions;
    return defineMdastPlugin({
        name: "temml",
        math(node, ctx) {
            return { rawHtml: renderMath(node, true, settings, ctx, logger) };
        },
        inlineMath(node, ctx) {
            return {
                type: "html",
                value: renderMath(node, false, settings, ctx, logger),
            };
        },
    });
}
