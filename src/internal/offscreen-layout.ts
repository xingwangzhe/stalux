import type { ExpressiveCodePlugin } from "astro-expressive-code";
import { parse as parseCss, walk as walkCss } from "css-tree";
import type { DefaultTreeAdapterMap } from "parse5";

interface AstNode {
    type: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    children?: AstNode[];
}

function styleProperties(value: unknown): { text: string; names: Set<string> } | undefined {
    if (value !== undefined && typeof value !== "string") return;
    const text = value ?? "";
    const names = new Set<string>();
    try {
        walkCss(parseCss(text, { context: "declarationList" }), {
            visit: "Declaration",
            enter(node) {
                names.add(node.property.toLowerCase());
            },
        });
    } catch {
        return;
    }
    return { text, names };
}

const classes = (node: AstNode) => {
    const value = node.properties?.className;
    return Array.isArray(value) ? value.map(String) : String(value ?? "").split(/\s+/u);
};

/** Non-wrapping EC rows are exactly one inherited line-height each, including empty rows. */
export function containCodeBlocks(node: AstNode): number {
    let changed = 0;
    if (node.type === "element" && node.tagName === "pre" && !classes(node).includes("wrap")) {
        const code = node.children?.find(
            (child) => child.type === "element" && child.tagName === "code",
        );
        const lines = code?.children ?? [];
        if (
            code &&
            lines.length &&
            lines.every((line) => line.type === "element" && classes(line).includes("ec-line"))
        ) {
            code.properties ??= {};
            const properties = code.properties;
            const style = styleProperties(properties.style);
            if (
                style &&
                !style.names.has("content-visibility") &&
                !style.names.has("contain-intrinsic-block-size") &&
                !["height", "block-size", "min-height", "max-height"].some((name) =>
                    style.names.has(name),
                )
            ) {
                properties.style = `${style.text};content-visibility:auto;contain-intrinsic-block-size:auto calc(${lines.length} * 1lh)`;
                properties["data-stalux-offscreen-code"] = "";
                changed++;
            }
        }
    }
    for (const child of node.children ?? []) changed += containCodeBlocks(child);
    return changed;
}

export function codeContainmentPlugin(): ExpressiveCodePlugin {
    return {
        name: "stalux-offscreen-code",
        hooks: {
            postprocessRenderedBlockGroup({ renderData }) {
                containCodeBlocks(renderData.groupAst);
            },
        },
    };
}

/** Mermaid SVGs have an exact viewBox ratio; skipping offscreen paint need not estimate their size. */
export function containMermaidSvgs(document: DefaultTreeAdapterMap["document"]): number {
    let changed = 0;
    function visit(node: DefaultTreeAdapterMap["node"]) {
        if ("tagName" in node) {
            if (node.tagName === "template" || node.tagName === "noscript") return;
            const attribute = (name: string) =>
                node.attrs.find((a) => a.name.toLowerCase() === name);
            if (node.tagName === "svg" && attribute("id")?.value.startsWith("satteri-mermaid-")) {
                const box = attribute("viewbox")
                    ?.value.trim()
                    .split(/[\s,]+/u)
                    .map(Number);
                const style = styleProperties(attribute("style")?.value);
                if (
                    box?.length === 4 &&
                    box.every(Number.isFinite) &&
                    (box[2] ?? 0) > 0 &&
                    (box[3] ?? 0) > 0 &&
                    style &&
                    !style.names.has("content-visibility")
                ) {
                    const ratio = style.names.has("aspect-ratio")
                        ? ""
                        : `;aspect-ratio:${box[2]}/${box[3]}`;
                    const value = `${style.text};content-visibility:auto${ratio}`;
                    const existing = attribute("style");
                    if (existing) existing.value = value;
                    else node.attrs.push({ name: "style", value });
                    node.attrs.push({ name: "data-stalux-offscreen-svg", value: "" });
                    changed++;
                }
            }
        }
        if ("childNodes" in node) for (const child of node.childNodes) visit(child);
    }
    visit(document);
    return changed;
}
