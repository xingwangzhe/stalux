import { insert } from "@orama/orama";
import { persist } from "@orama/plugin-data-persistence";
import { type DefaultTreeAdapterMap, parseFragment } from "parse5";
import { createHastHandle, renderHandle } from "satteri";
import { createSearchIndex, type SearchDocument, searchVector } from "../utils/orama-search";

type Node = DefaultTreeAdapterMap["node"];
const skipped = new Set(["script", "style", "template", "noscript", "nav", "footer", "form"]);
const blocks = new Set([
    "p",
    "div",
    "section",
    "article",
    "aside",
    "li",
    "br",
    "pre",
    "tr",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
]);

/** Index the rendered content entry, retaining adjacency across inline formatting. */
export function searchablePostBody(rendered: string | undefined, body: string | undefined): string {
    function text(node: Node): string {
        if (
            "tagName" in node &&
            (skipped.has(node.tagName) ||
                node.attrs.some(({ name }) => name === "data-pagefind-ignore"))
        )
            return "";
        if ("value" in node) return node.value;
        const children = "childNodes" in node ? node.childNodes.map(text).join("") : "";
        return "tagName" in node && blocks.has(node.tagName) ? ` ${children} ` : children;
    }
    const html = rendered ?? renderHandle(createHastHandle(body ?? "", { gfm: true, math: true }));
    return text(parseFragment(html)).replace(/\s+/gu, " ").trim();
}

export async function createOramaIndex(documents: SearchDocument[], cjk: boolean) {
    const database = createSearchIndex(cjk);
    for (const document of documents) {
        const record = {
            ...document,
            id: document.url,
            embedding: searchVector(
                `${document.title} ${document.description} ${document.keywords} ${document.content}`,
                cjk,
            ),
        };
        insert(database, record);
    }
    const serialized = await persist(database, "json");
    if (typeof serialized !== "string") throw new Error("Orama did not serialize a JSON index");
    return Bun.gzipSync(`{"cjk":${cjk},"data":${serialized},"count":${documents.length}}`);
}
