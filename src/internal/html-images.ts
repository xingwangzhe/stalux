import { type DefaultTreeAdapterMap, parse } from "parse5";

export interface HtmlImage {
    start: number;
    end: number;
    tag: string;
    attributes: Map<string, string>;
    locations: Map<string, { startOffset: number; endOffset: number }>;
    body?: number;
}

/** Source ranges preserve scripts and code-copy attributes byte-for-byte. */
export function findHtmlImages(
    html: string,
    document = parse(html, { sourceCodeLocationInfo: true }),
): HtmlImage[] {
    const images: HtmlImage[] = [];
    function visit(node: DefaultTreeAdapterMap["node"], body?: number) {
        if ("tagName" in node) {
            if (node.tagName === "template") return;
            const location = node.sourceCodeLocation;
            if (
                node.tagName === "section" &&
                node.attrs.some((attr) => attr.name === "data-pagefind-body")
            )
                body = location?.startOffset;
            if (node.tagName === "img" && location?.startTag) {
                const { startOffset: start, endOffset: end } = location.startTag;
                images.push({
                    start,
                    end,
                    tag: html.slice(start, end),
                    attributes: new Map(node.attrs.map((attr) => [attr.name, attr.value])),
                    locations: new Map(Object.entries(location.attrs ?? {})),
                    body,
                });
            }
        }
        if ("childNodes" in node) for (const child of node.childNodes) visit(child, body);
    }
    visit(document);
    return images.sort((left, right) => left.start - right.start);
}

export function imageLoadingUpdates(images: HtmlImage[]): Map<HtmlImage, Record<string, string>> {
    const firstSeen = new Set<number>();
    const changes = new Map<HtmlImage, Record<string, string>>();
    for (const image of images) {
        if (image.body === undefined) continue;
        const first = !firstSeen.has(image.body);
        firstSeen.add(image.body);
        const updates: Record<string, string> = {
            decoding: image.attributes.get("decoding") || "async",
            loading: first ? "eager" : "lazy",
        };
        if (first) updates.fetchpriority = "high";
        else if (image.attributes.get("fetchpriority") === "high") updates.fetchpriority = "auto";
        changes.set(image, updates);
    }
    return changes;
}

export function updateImageTag(image: HtmlImage, updates: Record<string, string>): string {
    let tag = image.tag;
    const edits: Array<{ start: number; end: number; value: string }> = [];
    const additions: string[] = [];
    for (const [name, value] of Object.entries(updates)) {
        const attribute = `${name}="${value.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}"`;
        const location = image.locations.get(name);
        if (location)
            edits.push({
                start: location.startOffset - image.start,
                end: location.endOffset - image.start,
                value: attribute,
            });
        else additions.push(attribute);
    }
    for (const edit of edits.sort((left, right) => right.start - left.start))
        tag = tag.slice(0, edit.start) + edit.value + tag.slice(edit.end);
    if (additions.length)
        tag = tag.replace(
            /\s*\/?\s*>$/,
            (ending) => ` ${additions.join(" ")}${ending.trimStart()}`,
        );
    return tag;
}
