import SwupA11yPlugin from "@swup/a11y-plugin";
import SwupHeadPlugin from "@swup/head-plugin";
import SwupJsPlugin from "@swup/js-plugin";
import SwupPreloadPlugin from "@swup/preload-plugin";
import SwupScrollPlugin from "@swup/scroll-plugin";
import Swup, { type Visit } from "swup";
import { getRouteKind } from "../utils/public-routes";
import { getRouteMotionPreset, type RouteMotionPreset } from "../utils/route-motion-policy";
import { installBackToTop } from "./back-to-top";
import { prepareNavigationFont } from "./navigation-font";
import "./navigation-client";
import { prepareNavigationScripts } from "./navigation-scripts";
import { prepareRouteMotion, type RouteMotion } from "./route-motion";
import { animateRouteOut } from "./route-out";
import { hydrateShells, markRetainedShells } from "./shell-hydration";
import { cancelPageScroll, glideToTop, type PageGlide, scrollPage } from "./smooth-scroll";

interface NavigationContext {
    controller: AbortController;
    from: URL;
    to: URL;
    direction: string;
    navigationType: "push" | "replace" | "traverse";
    sourceElement?: Element;
    preset: RouteMotionPreset;
    browserMotion: boolean;
    motion?: RouteMotion;
    executeScripts?: (signal?: AbortSignal) => Promise<void>;
    scriptsReady?: Promise<void>;
    obsoleteStyles: Element[];
    glide?: PageGlide;
    releaseOutgoing?: () => void;
}

type Position = { top: number; left: number; focus?: string };
const MAIN = "main[data-stalux-route]";

function abortObsoleteVisit(visit: Visit): void {
    // Swup 4.10 ships abort() but strips @internal members from its .d.ts.
    // Pin core to that audited version; recheck this adapter when upgrading it.
    (visit as Visit & { abort: () => void }).abort();
}

function dispatchNavigation(name: string, context: NavigationContext, nextDocument?: Document) {
    const event = Object.assign(new Event(name, { cancelable: true }), {
        from: context.from,
        to: context.to,
        direction: context.direction,
        navigationType: context.navigationType,
        sourceElement: context.sourceElement,
        signal: context.controller.signal,
        ...(nextDocument ? { newDocument: nextDocument } : {}),
    });
    document.dispatchEvent(event);
    return event;
}

function clearMotionState(): void {
    delete document.documentElement.dataset.staluxMotionPending;
    for (const key of ["staluxVtFrom", "staluxVtTo", "staluxVtDirection", "staluxVtPreset"])
        delete document.documentElement.dataset[key];
}

/** The exit fill is released by whichever path finishes first; never twice. */
function once(effect: () => void): () => void {
    let done = false;
    return () => {
        if (done) return;
        done = true;
        effect();
    };
}

/** Astro renders pages; Swup alone owns their client navigation and animation. */
export function installSwupRouter(): Swup {
    if (window.swup) return window.swup;
    const contexts = new WeakMap<Visit, NavigationContext>();
    const historyPositions = new Map<number, Position>();
    let authoredStyles = [...document.head.querySelectorAll("style,link[rel=stylesheet]")];
    let activeContext: NavigationContext | undefined;
    let visibleHistoryIndex = Number(window.history.state?.index ?? 1);
    let browserMotion = false;
    const scroll = new SwupScrollPlugin({
        doScrollingRightAway: false,
        animateScroll: { betweenPages: false, samePageWithHash: true, samePage: true },
        scrollFunction: scrollPage,
    });

    window.addEventListener(
        "popstate",
        (event) => {
            browserMotion =
                (event as PopStateEvent & { hasUAVisualTransition?: boolean })
                    .hasUAVisualTransition === true;
        },
        { capture: true },
    );

    const swup = new Swup({
        native: false,
        containers: [MAIN],
        animationSelector: false,
        animateHistoryBrowsing: true,
        timeout: 15_000,
        ignoreVisit: (href, { el }) => {
            const url = new URL(href, window.location.href);
            const target =
                el?.getAttribute("target") ??
                document.querySelector("base[target]")?.getAttribute("target");
            return (
                getRouteKind(url.pathname) === "other" ||
                /\.(?:md|json|xml|txt|html?|pdf|png|webp|avif|svg|jpe?g)$/i.test(url.pathname) ||
                Boolean(el?.closest("[data-no-swup],[data-astro-reload],[rel~=external]")) ||
                Boolean(target && target !== "_self")
            );
        },
        plugins: [
            new SwupHeadPlugin({
                awaitAssets: true,
                // Keep old CSS readable until replacement, then prune authored
                // orphans. Styles inserted by live SDKs remain available.
                persistTags: (el) => el.matches("script[src],style,link[rel=stylesheet]"),
            }),
            scroll,
            new SwupA11yPlugin({ headingSelector: "[data-stalux-motion-focus]" }),
            new SwupPreloadPlugin({
                preloadHoveredLinks: true,
                preloadVisibleLinks: false,
                throttle: 2,
            }),
            new SwupJsPlugin({
                animations: [
                    {
                        from: "(.*)",
                        to: "(.*)",
                        out: async () => {},
                        in: async (_done, { visit }) => {
                            const context = contexts.get(visit);
                            if (!context?.motion) return;
                            context.motion.start(
                                document.querySelector<HTMLElement>("[data-stalux-motion-focus]"),
                                {
                                    preset: context.preset,
                                    content: true,
                                    browserMotion: context.browserMotion,
                                    skip: context.controller.signal.aborted,
                                    releaseOutgoing: context.releaseOutgoing,
                                },
                            );
                            await context.motion.finished;
                        },
                    },
                ],
            }),
        ],
    });
    window.swup = swup;
    document.documentElement.dataset.staluxRouter = "swup";
    document.documentElement.dataset.staluxRoute = getRouteKind(window.location.pathname);
    installBackToTop();

    // Set this in the first synchronous before hook, even when a superseding
    // click skips the later context handler. Swup's page:load promise must settle
    // before an obsolete visit is stopped at the transition boundary.
    swup.hooks.before(
        "visit:start",
        (visit) => {
            visit.animation.wait = true;
        },
        { priority: -1000 },
    );

    swup.hooks.on("visit:start", (visit) => {
        cancelPageScroll();
        const focused = document.activeElement;
        const focus =
            focused instanceof HTMLAnchorElement
                ? (focused.getAttribute("href") ?? undefined)
                : undefined;
        historyPositions.set(visibleHistoryIndex, {
            top: window.scrollY,
            left: window.scrollX,
            focus,
        });
        if (historyPositions.size > 64) {
            const oldest = historyPositions.keys().next();
            if (!oldest.done) historyPositions.delete(oldest.value);
        }
        const from = new URL(visit.from.url + (visit.from.hash ?? ""), window.location.origin);
        const to = new URL(visit.to.url + (visit.to.hash ?? ""), window.location.origin);
        const navigationType = visit.history.popstate ? "traverse" : visit.history.action;
        const context: NavigationContext = {
            controller: new AbortController(),
            from,
            to,
            navigationType,
            direction: visit.history.direction === "backwards" ? "back" : "forward",
            sourceElement: visit.trigger.el,
            browserMotion: browserMotion && visit.history.popstate,
            preset: getRouteMotionPreset({
                from,
                to,
                navigationType,
                intent:
                    visit.trigger.el
                        ?.closest("[data-stalux-motion]")
                        ?.getAttribute("data-stalux-motion") ?? undefined,
                reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                browserMotion: browserMotion && visit.history.popstate,
                hidden: document.hidden,
            }),
            obsoleteStyles: [],
        };
        browserMotion = false;
        contexts.set(visit, context);
        activeContext = context;
        visit.animation.wait = true;
        visit.a11y.focus = visit.history.popstate ? false : { selector: MAIN, wait: true };
        if (dispatchNavigation("astro:before-preparation", context).defaultPrevented)
            visit.ignore();
    });

    swup.hooks.before("visit:transition", (visit) => {
        const context = contexts.get(visit);
        // renderPage updates the URL before content:replace. A revived stale
        // visit must stop here as well as before the later head/DOM work.
        if (!context || context.controller.signal.aborted || visit !== swup.visit)
            abortObsoleteVisit(visit);
    });

    swup.hooks.before(
        "content:replace",
        async (visit) => {
            const context = contexts.get(visit);
            // Swup 4 can resume a superseded async visit:start after abort. Stop
            // its entire remaining hook chain before HeadPlugin touches metadata.
            if (!context || context.controller.signal.aborted || visit !== swup.visit) {
                abortObsoleteVisit(visit);
                return;
            }
            const next = visit.to.document;
            if (!next) return;
            context.executeScripts = prepareNavigationScripts(next, { baseUrl: context.to.href });
            await prepareNavigationFont(next, context.controller.signal);
            if (context.controller.signal.aborted || visit !== swup.visit) {
                abortObsoleteVisit(visit);
                return;
            }
            const incoming = [...next.head.querySelectorAll("style,link[rel=stylesheet]")];
            context.obsoleteStyles = authoredStyles.filter(
                (el) => !incoming.some((other) => el.isEqualNode(other)),
            );
            dispatchNavigation("astro:after-preparation", context, next);
        },
        { priority: -100 },
    );

    // Assets are ready before old interactions are disposed. Replacement errors
    // propagate to Swup's full-document fallback instead of leaving a dead page.
    swup.hooks.replace("content:replace", async (visit, args, replace) => {
        const context = contexts.get(visit);
        // Swup can release an obsolete visit's parsed document while its async
        // hook chain is still unwinding. Cancellation precedes validation: a
        // missing document on an aborted visit is not a failed navigation.
        if (context?.controller.signal.aborted || visit.done || visit !== swup.visit) return;
        const next = visit.to.document;
        if (!(context && next && replace)) throw new Error("Missing Swup document");
        if (context.controller.signal.aborted) return;
        // Two cues overlap on the outgoing document: the content stage leaving,
        // and the page walking back to the top. Persisted sidebars, the header
        // and the frame are never part of either one.
        if (context.navigationType !== "traverse" && context.preset !== "none") {
            const outgoing = animateRouteOut(context.preset, context.controller.signal);
            if (!context.to.hash) context.glide = glideToTop();
            await context.glide?.promise;
            context.releaseOutgoing = once(await outgoing);
            if (context.controller.signal.aborted || visit !== swup.visit) {
                context.releaseOutgoing();
                return;
            }
        }
        const html = document.documentElement;
        html.dataset.staluxVtFrom = getRouteKind(context.from.pathname);
        html.dataset.staluxVtTo = getRouteKind(context.to.pathname);
        html.dataset.staluxVtDirection = context.direction;
        html.dataset.staluxVtPreset = context.preset;
        context.motion = prepareRouteMotion(dispatchNavigation("astro:before-swap", context, next));
        if (context.controller.signal.aborted) return;
        // Remember which shells exist now: after the swap only those slots need
        // refilling, because only those nodes came from the previous document.
        markRetainedShells();
        await replace(visit, args);
        // The stage node survives the swap, so the filled exit effect still holds
        // the incoming document at zero opacity. It is released inside
        // motion.start, in the same synchronous block as the entry cue: releasing
        // it here would paint the new document fully visible for one frame.
        if (context.controller.signal.aborted) return;
        for (const element of context.obsoleteStyles) element.remove();
        const incomingStyles = [...next.head.querySelectorAll("style,link[rel=stylesheet]")];
        authoredStyles = [...document.head.querySelectorAll("style,link[rel=stylesheet]")].filter(
            (el) => incomingStyles.some((other) => el.isEqualNode(other)),
        );
        // Main alone is replaced: header/footer/sentinel and background layers
        // keep their node identities. Never reset live background state to SSR 0.
        for (const { name, value } of [...next.body.attributes]) {
            if (
                name.startsWith("data-stalux-") &&
                name !== "data-stalux-bg-index" &&
                name !== "data-stalux-bg-layer"
            )
                document.body.setAttribute(name, value);
        }
        html.dataset.staluxRoute = getRouteKind(context.to.pathname);
        visibleHistoryIndex = Number(window.history.state?.index ?? visibleHistoryIndex);
        // Kept shells whose contents belong to the page (the article sidebars'
        // lists) take their children from the incoming document now, before any
        // page module mounts, so nothing needs to re-render or re-measure later.
        hydrateShells(next);
        dispatchNavigation("astro:after-swap", context, next);
        // The entry cue has to own the first painted frame of the new document.
        // content:scroll is an await and a rAF away, and running the incoming
        // scripts can block the main thread for hundreds of milliseconds: the
        // reader would see the finished page for one or more frames and only
        // then watch it jump to the entry offset and slide back, which reads as
        // the page shaking. Put the scroll at its final position and start the
        // cue in this same synchronous block, before the scripts run, so the
        // compositor already owns the cue while the main thread is busy. A visit
        // with a hash or a history traversal keeps the deferred path, because its
        // scroll is not decided yet.
        if (
            // A history traversal restores a position that is only known later,
            // and a hash target is decided by the anchor.
            !visit.history.popstate &&
            context.navigationType !== "traverse" &&
            !context.to.hash &&
            context.preset !== "none" &&
            // ScrollPlugin owns visit.scroll; a bare visit has no reset flag.
            visit.scroll?.reset !== false
        ) {
            const position = scroll.getCachedScrollPositions?.(visit.to.url)?.window;
            const top = position?.top ?? 0;
            const left = position?.left ?? 0;
            if (window.scrollY !== top || window.scrollX !== left)
                window.scrollTo({ top, left, behavior: "instant" });
            startMotion(visit);
        }
        context.scriptsReady = context.executeScripts?.(context.controller.signal);
    });

    swup.hooks.replace(
        "content:scroll",
        async (visit, args, defaultScroll) => {
            const saved = visit.history.popstate
                ? historyPositions.get(Number(window.history.state?.index))
                : undefined;
            if (visit.history.popstate) {
                // ScrollPlugin defers unanimated popstate to the browser, but Swup
                // uses manual restoration even for reduced motion and native swipes.
                const position = saved ??
                    scroll.getCachedScrollPositions(visit.to.url)?.window ?? { top: 0, left: 0 };
                window.scrollTo({ top: position.top, left: position.left, behavior: "instant" });
                scroll.restoreScrollContainers(visit.to.url);
                if (saved?.focus) {
                    const link = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].find(
                        (el) => el.getAttribute("href") === saved.focus,
                    );
                    link?.focus({ preventScroll: true });
                }
                startMotion(visit);
                return true;
            }
            await defaultScroll?.(visit, args);
            // ScrollPlugin scrolls in rAF; finish it before heading visibility checks.
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            startMotion(visit);
            return true;
        },
        { priority: 10 },
    );

    function startMotion(visit: Visit): void {
        const context = contexts.get(visit);
        if (!context || context !== activeContext || visit !== swup.visit) return;
        delete document.documentElement.dataset.staluxMotionPending;
        context?.motion?.start(document.querySelector<HTMLElement>("[data-stalux-motion-focus]"), {
            preset: context.preset,
            content: true,
            skip: !visit.animation.animate || context.controller.signal.aborted,
            browserMotion: context.browserMotion,
            releaseOutgoing: context.releaseOutgoing,
        });
    }

    swup.hooks.on("page:view", async (visit) => {
        const context = contexts.get(visit);
        if (!context || context.controller.signal.aborted) return;
        await context.scriptsReady;
        if (context.controller.signal.aborted) return;
        dispatchNavigation("astro:page-load", context);
        if (!visit.animation.animate)
            context.motion?.start(null, { skip: true, releaseOutgoing: context.releaseOutgoing });
    });
    swup.hooks.replace("link:self", () => undefined);

    const cancel = (visit: Visit) => {
        const context = contexts.get(visit);
        context?.controller.abort();
        context?.glide?.cancel();
        // An aborted visit keeps no exit fill: without this the stage would stay
        // transparent until the next successful navigation.
        context?.releaseOutgoing?.();
        context?.motion?.cancel();
        if (context === activeContext) {
            clearMotionState();
            document.documentElement.removeAttribute("aria-busy");
            activeContext = undefined;
        }
    };
    swup.hooks.on("visit:abort", cancel);
    swup.hooks.on("visit:fail", cancel);
    swup.hooks.on("visit:end", (visit) => {
        const context = contexts.get(visit);
        context?.glide?.cancel();
        context?.releaseOutgoing?.();
        context?.motion?.start(null, { skip: true });
        if (activeContext === context) {
            clearMotionState();
            activeContext = undefined;
        }
    });
    swup.hooks.on("cache:set", () => {
        while (swup.cache.size > 32) {
            const oldest = swup.cache.all.keys().next();
            if (oldest.done) break;
            swup.cache.delete(oldest.value);
        }
    });
    // Parsed DOM, not window.load: slow third-party resources cannot hold the
    // first page's interactions hostage. Page-runtime dedupes the early mount.
    const initialLoad = () => document.dispatchEvent(new Event("astro:page-load"));
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", initialLoad, { once: true });
    else queueMicrotask(initialLoad);
    return swup;
}
