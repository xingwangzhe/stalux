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

export type TransitionAnimation = {
    name: string;
    delay?: number | string;
    duration?: number | string;
    easing?: string;
    fillMode?: string;
    direction?: string;
};

export type SidebarSide = "left" | "right";

export type RouteAnimation = {
    forwards: {
        old: TransitionAnimation | TransitionAnimation[];
        new: TransitionAnimation | TransitionAnimation[];
    };
    backwards: {
        old: TransitionAnimation | TransitionAnimation[];
        new: TransitionAnimation | TransitionAnimation[];
    };
};

const easing = "cubic-bezier(0.25, 0.9, 0.2, 1)";
const exitAnimation: TransitionAnimation = {
    name: "stalux-page-fade-out",
    duration: "0.32s",
    easing,
    fillMode: "both",
};

function createRouteAnimation(name: string, backName = `${name}-back`): RouteAnimation {
    return {
        forwards: {
            old: exitAnimation,
            new: {
                name: `stalux-page-${name}-in`,
                duration: "0.42s",
                easing,
                fillMode: "both",
            },
        },
        backwards: {
            old: exitAnimation,
            new: {
                name: `stalux-page-${backName}-in`,
                duration: "0.42s",
                easing,
                fillMode: "both",
            },
        },
    };
}

function normalizedPath(pathname: string): string {
    const path = pathname.replace(/\/+$/, "");
    return path || "/";
}

export function getRouteKind(pathname: string): RouteKind {
    const path = normalizedPath(pathname);

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

const routeAnimations: Record<RouteKind, RouteAnimation> = {
    home: createRouteAnimation("home", "home-back"),
    archive: createRouteAnimation("vertical", "vertical-back"),
    links: createRouteAnimation("grid", "grid-back"),
    words: createRouteAnimation("rise", "rise-back"),
    about: createRouteAnimation("content", "content-back"),
    "tags-index": createRouteAnimation("tag-cloud", "tag-cloud-back"),
    "tags-detail": createRouteAnimation("from-right", "from-left"),
    "categories-index": createRouteAnimation("category-grid", "category-grid-back"),
    "categories-detail": createRouteAnimation("from-left", "from-right"),
    article: createRouteAnimation("article", "article-back"),
    "not-found": createRouteAnimation("error", "error-back"),
    other: createRouteAnimation("fade", "fade-back"),
};

export function getRouteAnimation(routeKind: RouteKind): RouteAnimation {
    return routeAnimations[routeKind];
}

function createSidebarAnimation(
    side: SidebarSide,
    phase: "in" | "out",
    backwards: boolean,
): TransitionAnimation {
    return {
        name: `stalux-sidebar-${side}-${backwards ? "back-" : ""}${phase}`,
        duration: "0.8s",
        easing,
        fillMode: "both",
    };
}

export function getSidebarAnimation(side: SidebarSide): RouteAnimation {
    return {
        forwards: {
            old: createSidebarAnimation(side, "out", false),
            new: createSidebarAnimation(side, "in", false),
        },
        backwards: {
            old: createSidebarAnimation(side, "out", true),
            new: createSidebarAnimation(side, "in", true),
        },
    };
}
