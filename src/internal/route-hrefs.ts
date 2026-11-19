import type { DefaultTreeAdapterMap } from "parse5";
import { getRouteKind, isRealPublicFile, toRoutePath } from "../utils/public-routes";

type Document = DefaultTreeAdapterMap["document"];

/**
 * Rewrite a site-absolute href to the form the router actually serves.
 *
 * Page routes use the configured trailing-slash style,
 * while real files keep their extension (`/posts/x.md`, `/api/posts.json`)
 * and no added slash. Only rooted paths are touched: relative links,
 * protocol-relative URLs and anchors pass through.
 */
export function normalizeRouteHref(href: string, origin?: string, trailingSlash?: boolean): string {
    if (origin && href.startsWith(`${origin}/`)) {
        return origin + normalizeRouteHref(href.slice(origin.length), undefined, trailingSlash);
    }
    if (!href.startsWith("/") || href.startsWith("//")) return href;
    const match = /^([^?#]*)([?#].*)?$/u.exec(href);
    const path = match?.[1] ?? href;
    const suffix = match?.[2] ?? "";
    if (path === "/" || isRealPublicFile(path) || getRouteKind(path) === "other") {
        return href;
    }
    return `${toRoutePath(path, trailingSlash)}${suffix}`;
}

/**
 * Content-authored links may include a trailing slash. Normalising the parsed
 * document here keeps hand-written Markdown aligned with the router without
 * touching the author's source.
 */
export function normalizeRouteHrefs(
    document: Document,
    origin?: string,
    trailingSlash?: boolean,
): number {
    let changed = 0;
    const visit = (node: DefaultTreeAdapterMap["node"]): void => {
        if ("tagName" in node && node.tagName === "a") {
            for (const attribute of node.attrs) {
                if (attribute.name !== "href") continue;
                const next = normalizeRouteHref(attribute.value, origin, trailingSlash);
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
