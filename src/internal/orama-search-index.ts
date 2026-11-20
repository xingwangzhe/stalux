import path from "node:path";
import { insert } from "@orama/orama";
import { persist } from "@orama/plugin-data-persistence";
import { type DefaultTreeAdapterMap, parse } from "parse5";
import { createSearchIndex, type SearchDocument, searchVector } from "../utils/orama-search";
import { toRoutePath } from "../utils/public-routes";

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
const attr = (node: Node, name: string) =>
    "attrs" in node ? node.attrs.find((item) => item.name === name)?.value : undefined;

/** Extract only real indexed DOM, preserving adjacency across inline emphasis. */
export function extractSearchDocument(html: string, url: string): SearchDocument | null {
    const document = parse(html);
    let language = "";
    let title = "";
    let documentTitle = "";
    let description = "";
    let keywords = "";
    let hasBody = false;
    let post = "";
    let published = Number.MIN_SAFE_INTEGER;
    let publishedDate = "";
    let category = "";
    const tags: string[] = [];
    function text(node: Node): string {
        if (
            "tagName" in node &&
            (skipped.has(node.tagName) || attr(node, "data-pagefind-ignore") !== undefined)
        )
            return "";
        if ("value" in node) return node.value;
        const body = "childNodes" in node ? node.childNodes.map(text).join("") : "";
        return "tagName" in node && blocks.has(node.tagName) ? ` ${body} ` : body;
    }
    const parts: string[] = [];
    function visit(node: Node, insideBody = false) {
        if ("tagName" in node) {
            if (skipped.has(node.tagName) || attr(node, "data-pagefind-ignore") !== undefined)
                return;
            if (node.tagName === "title") documentTitle = text(node).trim();
            if (node.tagName === "html") language = attr(node, "lang") ?? "";
            if (node.tagName === "meta") {
                const property = attr(node, "property");
                const value = attr(node, "content") ?? "";
                if (property === "article:published_time") publishedDate = value;
                if (property === "article:section") category = value;
                if (property === "article:tag" && value) tags.push(value);
            }
            if (node.tagName === "h1" && !title) title = text(node).trim();
            if (attr(node, "data-stalux-search-description") !== undefined)
                description = text(node).trim();
            if (attr(node, "data-stalux-search-keywords") !== undefined)
                keywords = attr(node, "data-search-keywords") ?? "";
            post = attr(node, "data-stalux-post-id") ?? post;
            const sort = attr(node, "data-pagefind-sort");
            if (sort?.startsWith("published:")) published = Number(sort.slice("published:".length));
            const body = attr(node, "data-pagefind-body") !== undefined;
            if (body) {
                hasBody = true;
                if (!insideBody) parts.push(text(node));
                const attrs = attr(node, "data-pagefind-index-attrs")?.split(",") ?? [];
                for (const name of attrs) parts.push(attr(node, name.trim()) ?? "");
            }
            insideBody ||= body;
        }
        if ("childNodes" in node) for (const child of node.childNodes) visit(child, insideBody);
    }
    visit(document);
    if (!hasBody) return null;
    const content = parts.join(" ").replace(/\s+/gu, " ").trim();
    return {
        url,
        title: title || documentTitle || url,
        description,
        keywords,
        language: language.toLowerCase(),
        post,
        published,
        publishedDate,
        category,
        tags,
        content,
    };
}

export async function writeOramaIndex(
    outDir: string,
    htmlFiles: string[],
    base: string,
    trailingSlash: boolean,
    cjk: boolean,
) {
    const database = createSearchIndex(cjk);
    let count = 0;
    for (const file of htmlFiles) {
        const html = await Bun.file(path.join(outDir, file)).text();
        if (!html.includes("data-pagefind-body")) continue;
        const route = toRoutePath(`/${file.replace(/(?:^|\/)index\.html$/u, "")}`, trailingSlash);
        const url = `${base.replace(/\/$/u, "")}${route}`;
        const document = extractSearchDocument(html, url);
        if (!document) continue;
        insert(
            database,
            {
                ...document,
                embedding: searchVector(
                    `${document.title} ${document.description} ${document.keywords} ${document.content}`,
                    cjk,
                ),
            },
            url,
        );
        count++;
    }
    const serialized = await persist(database, "json");
    if (typeof serialized !== "string") throw new Error("Orama did not serialize a JSON index");
    const asset = path.join(outDir, "orama", "index.bin");
    await Bun.write(asset, Bun.gzipSync(`{"cjk":${cjk},"data":${serialized},"count":${count}}`));
    return { count, asset };
}
