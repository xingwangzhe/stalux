import { getRouteKind, normalizePublicPath } from "./public-routes";

export type RouteMotionPreset =
    | "none"
    | "fade"
    | "enter"
    | "up"
    | "taxonomy"
    | "previous"
    | "next"
    | "home"
    | "restore"
    | "error";

interface MotionContext {
    from: URL;
    to: URL;
    navigationType?: string;
    intent?: string;
    reducedMotion?: boolean;
    browserMotion?: boolean;
    hidden?: boolean;
}

/** Choose a visual hint, never a navigation or scroll operation. */
export function getRouteMotionPreset(context: MotionContext): RouteMotionPreset {
    const { from, to } = context;
    const source = getRouteKind(from.pathname);
    const target = getRouteKind(to.pathname);
    if (
        context.hidden ||
        context.reducedMotion ||
        context.browserMotion ||
        from.origin !== to.origin ||
        source === "other" ||
        target === "other" ||
        (normalizePublicPath(from.pathname) === normalizePublicPath(to.pathname) &&
            from.search === to.search)
    ) {
        return "none";
    }
    // Both directions restore an existing history entry. A push to a parent
    // route is not a history traversal, and an article's previous/next is not back.
    if (context.navigationType === "traverse") return "restore";
    if (context.navigationType === "replace") return "fade";
    if (target === "not-found") return "error";
    if (source === "not-found") return "fade";
    if (target === "home") return "home";
    if (source === "article" && target === "article") {
        return context.intent === "previous" || context.intent === "next" ? context.intent : "fade";
    }
    if (target === "article") return "enter";
    if (target === "tags-detail" || target === "categories-detail") return "taxonomy";
    if (
        (source === "article" &&
            (target === "archive" || target === "tags-index" || target === "categories-index")) ||
        (source === "tags-detail" && target === "tags-index") ||
        (source === "categories-detail" && target === "categories-index")
    ) {
        return "up";
    }
    return source === "home" ? "enter" : "fade";
}
