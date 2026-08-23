export type RouteKind =
    | "home"
    | "archive"
    | "links"
    | "words"
    | "about"
    | "tags-index"
    | "tags-detail"
    | "categories-index"
    | "categories-detail"
    | "article"
    | "not-found"
    | "other";

export function normalizePublicPath(pathname: string): string {
    const path = pathname.split(/[?#]/, 1)[0]?.replace(/\/+$/, "") ?? "";
    return path || "/";
}

export function getRouteKind(pathname: string): RouteKind {
    const path = normalizePublicPath(pathname);

    if (path === "/") return "home";
    if (path === "/archives") return "archive";
    if (path === "/links") return "links";
    if (path === "/words") return "words";
    if (path === "/about") return "about";
    if (path === "/404") return "not-found";
    if (path === "/tags") return "tags-index";
    if (path.startsWith("/tags/")) return "tags-detail";
    if (path === "/categories") return "categories-index";
    if (path.startsWith("/categories/")) return "categories-detail";
    if (path.startsWith("/posts/")) return "article";

    return "other";
}

export function getMarkdownPath(pathname: string): string | undefined {
    const path = normalizePublicPath(pathname);

    if (path === "/") return "/index.md";
    if (path === "/tags" || path === "/categories") return `${path}/index.md`;
    if (["/about", "/archives", "/links", "/words"].includes(path)) return `${path}.md`;
    if (/^\/(?:posts|tags|categories)\/[^/]+$/.test(path)) return `${path}.md`;
    return undefined;
}

export function toPublicUrl(site: string, pathname: string, markdown = false): string {
    const base = site.replace(/\/+$/, "");
    const normalized = normalizePublicPath(pathname);
    const path = markdown ? getMarkdownPath(normalized) : normalized;
    if (!path) return `${base}${normalized === "/" ? "/" : `${normalized}/`}`;
    return markdown ? `${base}${path}` : `${base}${path === "/" ? "/" : `${path}/`}`;
}
