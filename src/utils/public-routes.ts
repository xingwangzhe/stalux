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

/** Real files keep their extension; page routes may carry one trailing slash. */
export const REAL_FILE_PATH =
    /\.(?:md|json|xml|txt|html?|pdf|png|webp|avif|svg|jpe?g|gif|ico|css|js|mjs|map|zip|gz|br|mp4|webm|mp3|wav|ogg|woff2?|ttf|otf|eot|wasm|webmanifest|csv|tsv|asc|apk|deb|rpm|dmg|exe|7z|rar|tar)$/iu;

const MARKDOWN_EXPORT_PATH =
    /^\/(?:index|about|archives|links|words|tags\/index|categories\/index)\.md$|^\/(?:posts|tags|categories)\/[^/]+\.md$/u;

/**
 * Distinguish real endpoints from page slugs that merely end in an extension.
 * Tags such as `node.js`, `Three.js` and `d3.js` are pages, while
 * `/posts/x.md` and `/api/posts.json` are files that must never gain a slash.
 */
export function isRealPublicFile(pathname: string): boolean {
    const path = normalizePublicPath(pathname);
    if (path === "/404" || MARKDOWN_EXPORT_PATH.test(path)) return true;
    if (getRouteKind(path) !== "other") return false;
    return REAL_FILE_PATH.test(path);
}

export function normalizePublicPath(pathname: string): string {
    const path = pathname.split(/[?#]/u, 1)[0]?.replace(/\/+$/u, "") ?? "";
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
    if (/^\/(?:posts|tags|categories)\/[^/]+$/u.test(path)) return `${path}.md`;
    return undefined;
}

/**
 * The public form of an HTML route. Every page route carries exactly one
 * trailing slash (`/posts/x/`, `/tags/x/`, `/archives/`). Real files —
 * Markdown exports, JSON/XML endpoints, images — are returned untouched so
 * they keep the extension that identifies them. The static 404 document is
 * emitted as `404.html`, so its public route remains `/404`.
 */
export function toRoutePath(pathname: string): string {
    const path = normalizePublicPath(pathname);
    if (path === "/") return "/";
    if (isRealPublicFile(path)) return path;
    return `${path}/`;
}

export function toPublicUrl(site: string, pathname: string, markdown = false): string {
    const base = site.replace(/\/+$/u, "");
    const path = markdown ? getMarkdownPath(pathname) : toRoutePath(pathname);
    if (!path) return `${base}${toRoutePath(pathname)}`;
    if (!markdown && path === "/") return base;
    return `${base}${path}`;
}
