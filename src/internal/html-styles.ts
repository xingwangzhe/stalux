import { type DefaultTreeAdapterMap, defaultTreeAdapter } from "parse5";

type Element = DefaultTreeAdapterMap["element"];

/** Astro's router preloads head styles only; EC emits its shared CSS inside the first block. */
export function promoteCodeStyles(document: DefaultTreeAdapterMap["document"]): number {
    let head: Element | undefined;
    const links: Element[] = [];
    function visit(node: DefaultTreeAdapterMap["node"], inCode = false) {
        if ("tagName" in node) {
            if (node.tagName === "template" || node.tagName === "noscript") return;
            if (node.tagName === "head") head = node;
            inCode ||= (
                node.attrs.find((a) => a.name === "class")?.value.split(/\s+/) ?? []
            ).includes("expressive-code");
            if (
                inCode &&
                node.tagName === "link" &&
                node.attrs.some((a) => a.name === "rel" && a.value === "stylesheet")
            )
                links.push(node);
        }
        if ("childNodes" in node) for (const child of node.childNodes) visit(child, inCode);
    }
    visit(document);
    if (!head) return 0;
    for (const link of links) {
        // Clone metadata without source ranges so the shared mutation emitter can
        // remove the original bytes and insert the reference without rewriting prose.
        const promoted = defaultTreeAdapter.createElement(
            "link",
            link.namespaceURI,
            link.attrs.map((a) => ({ ...a })),
        );
        defaultTreeAdapter.detachNode(link);
        defaultTreeAdapter.appendChild(head, promoted);
    }
    return links.length;
}
