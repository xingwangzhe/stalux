import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { type DefaultTreeAdapterMap, parse } from "parse5";
import { type CjkDocument, cjkGrams, gramShard, normalizeSearch } from "../utils/cjk-search";
import { forEachBounded } from "./bounded-tasks";

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
export function extractCjkDocument(html: string, url: string) {
    const document = parse(html);
    let language = "";
    let title = "";
    let documentTitle = "";
    let description = "";
    let keywords = "";
    let hasBody = false;
    const filters: Record<string, string[]> = {};
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
            if (node.tagName === "h1" && !title) title = text(node).trim();
            if (attr(node, "data-stalux-search-description") !== undefined)
                description = text(node).trim();
            if (attr(node, "data-stalux-search-keywords") !== undefined)
                keywords = attr(node, "data-search-keywords") ?? "";
            const filter = attr(node, "data-pagefind-filter");
            if (filter) {
                const match = /^([^[\]:]+)\[([^\]]+)\]$/u.exec(filter);
                if (match) filters[match[1] as string] = [attr(node, match[2] as string) ?? ""];
            }
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
        language,
        filters,
        content,
    };
}

/** Content-addressed shards prevent mixed old/new deployments and keep downloads query-specific. */
export async function writeCjkSearchIndex(outDir: string, htmlFiles: string[], base: string) {
    const directory = path.join(outDir, "pagefind", "cjk");
    await mkdir(directory, { recursive: true });
    async function asset(value: unknown) {
        const json = JSON.stringify(value);
        const hash = createHash("sha256").update(json).digest("hex").slice(0, 20);
        const file = `${hash}.json`;
        await writeFile(path.join(directory, file), json);
        return file;
    }
    const extracted = new Map<string, NonNullable<ReturnType<typeof extractCjkDocument>>>();
    await forEachBounded(htmlFiles, 6, async (file) => {
        const html = await readFile(path.join(outDir, file), "utf8");
        // Most output pages are archives/tags: don't parse pages without indexed sections.
        if (!html.includes("data-pagefind-body")) return;
        const url = `${base.replace(/\/$/u, "")}/${file.replace(/index\.html$/u, "")}`;
        const record = extractCjkDocument(html, url);
        if (record) extracted.set(file, record);
    });
    const documents: CjkDocument[] = [];
    const postings: Record<string, Record<string, number[]>> = {};
    for (const [, record] of [...extracted].sort(([a], [b]) => a.localeCompare(b))) {
        const { content, ...meta } = record;
        const id = documents.length;
        documents.push({ ...meta, file: await asset({ content }) });
        for (const gram of cjkGrams(normalizeSearch(content))) {
            const key = gramShard(gram);
            postings[key] ??= {};
            const shard = postings[key];
            shard[gram] ??= [];
            shard[gram].push(id);
        }
    }
    const shards: Record<string, string> = {};
    for (const [key, value] of Object.entries(postings)) shards[key] = await asset(value);
    await writeFile(path.join(directory, "manifest.json"), JSON.stringify({ documents, shards }));
    return documents.length;
}
