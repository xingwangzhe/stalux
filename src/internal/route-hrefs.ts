import type { DefaultTreeAdapterMap } from "parse5";

type Document = DefaultTreeAdapterMap["document"];

/** Endpoints that are real files: the extension identifies them, never a slash. */
const REAL_FILE =
    /\.(?:md|json|xml|txt|html?|pdf|png|webp|avif|svg|jpe?g|gif|ico|css|js|mjs|map|zip|mp4|webm|woff2?|ttf|otf)$/iu;

/**
 * Rewrite a site-absolute href to the form the router actually serves.
 *
 * Page routes carry no trailing slash (`/posts/x`, `/archives`), while real
 * files keep theirs (`/posts/x.md`, `/api/posts.json`). Only rooted paths are
 * touched: relative links, protocol-relative URLs and anchors pass through.
 */
export function normalizeRouteHref(href: string): string {
    if (!href.startsWith("/") || href.startsWith("//")) return href;
    const match = /^([^?#]*)([?#].*)?$/u.exec(href);
    const path = match?.[1] ?? href;
    const suffix = match?.[2] ?? "";
    if (path === "/" || !path.endsWith("/") || REAL_FILE.test(path)) return href;
    return `${path.replace(/\/+$/u, "")}${suffix}`;
}

/**
 * Content-authored links still use the old trailing-slash form. Normalising the
 * parsed document here keeps hand-written Markdown from reintroducing a URL
 * shape the router no longer serves, without touching the author's source.
 */
export function normalizeRouteHrefs(document: Document): number {
    let changed = 0;
    const visit = (node: DefaultTreeAdapterMap["node"]): void => {
        if ("tagName" in node && node.tagName === "a") {
            for (const attribute of node.attrs) {
                if (attribute.name !== "href") continue;
                const next = normalizeRouteHref(attribute.value);
                if (next !== attribute.value) {
                    attribute.value = next;
                    changed++;
                }
            }
        }
        if ("childNodes" in node) for (const child of node.childNodes) visit(child);
    };
    visit(document);
    return changed;
}
