import { getRouteKind, type RouteKind } from "./public-routes";

export { getRouteKind, type RouteKind };

/** Stable, CSS-safe transition names for matching a post card to its title. */
export function getPostTitleTransitionName(postId: string | number): string {
    let hash = 2166136261;
    for (const character of String(postId)) {
        hash ^= character.codePointAt(0) ?? 0;
        hash = Math.imul(hash, 16777619);
    }
    return `stalux-post-title-${(hash >>> 0).toString(36)}`;
}

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

const easing = "cubic-bezier(0.22, 0.72, 0.22, 1)";
const exitAnimation: TransitionAnimation = {
    name: "stalux-page-exit",
    duration: "0.14s",
    easing,
    fillMode: "both",
};

function createRouteAnimation(name: string, backName = `${name}-back`): RouteAnimation {
    return {
        forwards: {
            old: exitAnimation,
            new: {
                name: `stalux-${name}`,
                duration: "0.22s",
                easing,
                fillMode: "both",
            },
        },
        backwards: {
            old: exitAnimation,
            new: {
                name: `stalux-${backName}`,
                duration: "0.22s",
                easing,
                fillMode: "both",
            },
        },
    };
}

const routeAnimations: Record<RouteKind, RouteAnimation> = {
    home: createRouteAnimation("page-enter"),
    archive: createRouteAnimation("page-enter"),
    links: createRouteAnimation("page-enter"),
    words: createRouteAnimation("page-enter"),
    about: createRouteAnimation("page-enter"),
    "tags-index": createRouteAnimation("page-enter"),
    "tags-detail": createRouteAnimation("taxonomy-enter", "taxonomy-enter-back"),
    "categories-index": createRouteAnimation("page-enter"),
    "categories-detail": createRouteAnimation("taxonomy-enter", "taxonomy-enter-back"),
    article: createRouteAnimation("article-enter", "article-enter-back"),
    "not-found": createRouteAnimation("page-enter"),
    other: createRouteAnimation("page-enter"),
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
        duration: "0.22s",
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
