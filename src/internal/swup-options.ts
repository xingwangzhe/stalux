/**
 * Swup configuration handed to `@swup/astro`.
 *
 * `@swup/astro` owns construction of the Swup instance and all plugin
 * assembly; the theme only describes *which* behaviour it wants. Anything that
 * cannot be expressed here lives in `src/scripts/route-guards.ts`.
 */
import type { Options, Route } from "@swup/astro";

/** Named routes shared by the router and the route classifier. */
export const SWUP_ROUTES: Route[] = [
    { name: "home", path: "/" },
    { name: "article", path: "/posts/:post" },
    { name: "archive", path: "/archives" },
    { name: "tags-index", path: "/tags" },
    { name: "tags-detail", path: "/tags/:tag" },
    { name: "categories-index", path: "/categories" },
    { name: "categories-detail", path: "/categories/:category" },
    ...["about", "links", "words"].map((name) => ({ name, path: `/${name}` })),
    { name: "not-found", path: "/404" },
];

/**
 * Real files are never pages. `@swup/astro` builds `ignoreVisit` itself and
 * only lets `ignore` extend it, so this list is the whole hook.
 */
export const SWUP_IGNORE_FILES = /\.(?:md|json|xml|txt|html?|pdf|png|webp|avif|svg|jpe?g)$/iu;

/**
 * Paths the theme renders as soft-navigable pages.
 *
 * `@swup/astro` cannot express "only these routes" as a predicate: `ignore`
 * accepts regexes, and a regex is the only form that survives serialisation
 * into the init script. Keeping the alternation here also keeps the rule next
 * to `SWUP_ROUTES` above, which is the same set of pages.
 */
const SOFT_NAV_PATHS =
    /^\/(?:|archives|links|words|about|404|tags(?:\/[^/?#]+)?|categories(?:\/[^/?#]+)?|posts\/[^/?#]+)\/?(?:[?#].*)?$/u;

/** Every path the theme itself renders; anything else is left to the browser. */
export const SWUP_IGNORE_UNKNOWN_ROUTES = new RegExp(`^(?!${SOFT_NAV_PATHS.source})`, "u");

/**
 * `@swup/astro` types most plugin options as booleans, but forwards any object
 * it is given straight into the plugin constructor. Two of these need their
 * real plugin options (body-class prefix, head persistence, scroll behaviour),
 * so the object form is used deliberately and the cast is made once here.
 */
export const SWUP_OPTIONS = {
    containers: ["#swup-main"],
    // No route animation: no theme, and no `[class*="transition-"]` selector to
    // wait on. The swap is a plain, synchronous DOM replacement.
    theme: false,
    animationClass: false,
    // The init script must run while the first document is still parsing; on
    // idle the first click can arrive before the router is listening.
    loadOnIdle: false,
    // The guard script needs the instance; route-prefetch already reads it.
    globalInstance: true,
    // Page scripts are re-executed by the theme's own once-per-session runner
    // (see route-guards.ts). The plugin's whole-document pass would replay
    // analytics SDKs on every visit.
    reloadScripts: false,
    cache: true,
    native: false,
    morph: false,
    forms: false,
    preload: { hover: true, visible: false },
    progress: { delay: 80, transition: 200 },
    accessibility: true,
    updateBodyClass: { prefix: "page-", attributes: [/^data-stalux-(?!bg-)/u] },
    updateHead: {
        awaitAssets: true,
        // Keep old CSS readable while the incoming sheet loads; route-guards
        // removes the styles the new page does not use once it is in place.
        persistTags: "link[rel=stylesheet], script[src], style",
    },
    routes: SWUP_ROUTES,
    fragments: [
        {
            from: ["/tags/:slug", "/categories/:slug"],
            to: ["/tags/:slug", "/categories/:slug"],
            containers: ["#swup-taxonomy"],
            scroll: true,
        },
        {
            from: "/posts/:post",
            to: "/posts/:post",
            containers: ["#swup-article"],
            scroll: true,
        },
    ],
    smoothScrolling: {
        doScrollingRightAway: false,
        animateScroll: { betweenPages: false, samePageWithHash: true, samePage: true },
    },
    ignore: [SWUP_IGNORE_FILES, SWUP_IGNORE_UNKNOWN_ROUTES],
} as unknown as Partial<Options>;
