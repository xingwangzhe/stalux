import { type DefaultTreeAdapterMap, serialize, serializeOuter } from "parse5";

type Element = DefaultTreeAdapterMap["element"];

/**
 * Serialize AST mutations to image/style nodes without reserializing untouched page subtrees.
 * Source locations belong to the original parse; edits are emitted together after all mutations.
 */
export function createHtmlMutationEmitter(
    source: string,
    document: DefaultTreeAdapterMap["document"],
) {
    const snapshots: Array<{
        node: Element;
        start: number;
        end: number;
        attrs: Element["attrs"];
        text: string[];
    }> = [];
    let head: Element | undefined;
    function visit(node: DefaultTreeAdapterMap["node"]) {
        if ("tagName" in node) {
            if (node.tagName === "template") return;
            if (node.tagName === "head") head = node;
            const location = node.sourceCodeLocation;
            if (
                (node.tagName === "img" || node.tagName === "style" || node.tagName === "link") &&
                location
            ) {
                snapshots.push({
                    node,
                    start: location.startOffset,
                    end: location.endOffset,
                    attrs: node.attrs.map((attribute) => ({ ...attribute })),
                    text: node.childNodes.map((child) => ("value" in child ? child.value : "")),
                });
            }
        }
        if ("childNodes" in node) for (const child of node.childNodes) visit(child);
    }
    visit(document);

    return () => {
        const edits: Array<{ start: number; end: number; value: string }> = [];
        for (const snapshot of snapshots) {
            const { node, start, end, attrs, text } = snapshot;
            if (!node.parentNode) {
                edits.push({ start, end, value: "" });
                continue;
            }
            const changed =
                node.attrs.length !== attrs.length ||
                attrs.some((attribute, index) => {
                    const current = node.attrs[index];
                    return (
                        !current ||
                        attribute.name !== current.name ||
                        attribute.value !== current.value ||
                        attribute.namespace !== current.namespace ||
                        attribute.prefix !== current.prefix
                    );
                }) ||
                node.childNodes.length !== text.length ||
                text.some((value, index) => {
                    const child = node.childNodes[index];
                    return !child || ("value" in child ? child.value : "") !== value;
                });
            if (changed) edits.push({ start, end, value: serializeOuter(node) });
        }
        const inserted = head?.childNodes.filter(
            (node) =>
                "tagName" in node &&
                (node.tagName === "style" || node.tagName === "link") &&
                !node.sourceCodeLocation,
        );
        if (inserted?.length) {
            const position = head?.sourceCodeLocation?.endTag?.startOffset;
            // Documents with an implicit head have no insertion range; use the standard serializer.
            if (position === undefined) return serialize(document);
            edits.push({
                start: position,
                end: position,
                value: inserted.map((node) => serializeOuter(node)).join(""),
            });
        }
        if (!edits.length) return source;
        edits.sort((left, right) => left.start - right.start || left.end - right.end);
        const parts: string[] = [];
        let offset = 0;
        for (const edit of edits) {
            if (edit.start < offset) return serialize(document);
            parts.push(source.slice(offset, edit.start), edit.value);
            offset = edit.end;
        }
        parts.push(source.slice(offset));
        return parts.join("");
    };
}
