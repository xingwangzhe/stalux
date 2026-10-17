import { parseFragment } from "parse5";
import { defineHastPlugin, type HastNode } from "satteri";

declare module "satteri" {
    interface DataMap {
        staluxCaptionExclusions?: Set<number>;
    }
}

type Element = Extract<HastNode, { type: "element" }>;

function onlyElement(node: Element): Element | undefined {
    const children = node.children.filter(
        (child) => child.type !== "text" || child.value.trim().length > 0,
    );
    return children.length === 1 && children[0]?.type === "element" ? children[0] : undefined;
}

// Raw HTML wrappers remain sibling raw nodes in Markdown HAST. Parse a small
// structural shell to recognize paragraphs inside those wrappers as well.
function rawExclusions(root: Readonly<HastNode>): Set<number> {
    const excluded = new Set<number>();
    function scan(node: Readonly<HastNode>) {
        if (!("children" in node)) return;
        const children = node.children;
        if (children.some((child) => child.type === "raw")) {
            const shell = children
                .map((child, index) =>
                    child.type === "raw"
                        ? child.value
                        : `<span data-caption-index="${index}"></span>`,
                )
                .join("\n");
            const fragment = parseFragment(shell);
            function visit(
                current: typeof fragment | (typeof fragment.childNodes)[number],
                protectedParent = false,
            ) {
                const protectedNode =
                    protectedParent ||
                    ("tagName" in current &&
                        ["figure", "figcaption", "pre", "code", "template"].includes(
                            current.tagName,
                        ));
                if (protectedNode && "attrs" in current) {
                    const index = current.attrs.find((attr) => attr.name === "data-caption-index");
                    const child = index ? children[Number(index.value)] : undefined;
                    const offset = child?.position?.start.offset;
                    if (offset !== undefined) excluded.add(offset);
                }
                if ("childNodes" in current)
                    for (const child of current.childNodes) visit(child, protectedNode);
                if ("content" in current) visit(current.content, protectedNode);
            }
            visit(fragment);
        }
        for (const child of children) scan(child);
    }
    scan(root);
    return excluded;
}

/** Runs after PhotoSwipe so its link and all image properties remain intact. */
export const imageCaptions = defineHastPlugin({
    name: "stalux-image-captions",
    options: { position: true },
    before(root, ctx) {
        ctx.data.staluxCaptionExclusions = rawExclusions(root);
    },
    after(_root, ctx) {
        delete ctx.data.staluxCaptionExclusions;
    },
    element: {
        filter: ["p"],
        visit(node, ctx) {
            const offset = node.position?.start.offset;
            if (offset !== undefined && ctx.data.staluxCaptionExclusions?.has(offset)) return;
            for (
                let parent: Readonly<HastNode> | undefined = ctx.parent(node);
                parent;
                parent = ctx.parent(parent)
            ) {
                if (
                    parent.type === "element" &&
                    ["figure", "figcaption", "pre", "code", "template"].includes(parent.tagName)
                ) {
                    return;
                }
            }

            const content = onlyElement(node);
            if (!content) return;
            const image = content.tagName === "a" ? onlyElement(content) : content;
            if (image?.tagName !== "img") return;
            const caption = String(image.properties.alt ?? "").trim();
            if (!caption) return;

            ctx.replaceNode(node, {
                type: "element",
                tagName: "figure",
                properties: {
                    ...node.properties,
                    "data-stalux-image": "",
                },
                children: [
                    content,
                    {
                        type: "element",
                        tagName: "figcaption",
                        properties: {},
                        children: [{ type: "text", value: caption }],
                    },
                ],
            });
        },
    },
});
