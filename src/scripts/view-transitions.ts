import { getRouteKind } from "@utils/public-routes";
import { getRouteMotionPreset, type RouteMotionPreset } from "@utils/route-motion-policy";
import { installBackToTop } from "./back-to-top";
import { createClientLogger } from "./logger";
import { prepareNavigationFont } from "./navigation-font";
import { prepareRouteMotion, type RouteMotion } from "./route-motion";

const logger = createClientLogger("view-transitions");

interface TransitionWindow extends Window {
    __STALUX_VT_LISTENER__?: boolean;
}

function setRouteState(pathname: string): void {
    const html = document.documentElement;
    const route = getRouteKind(pathname);
    logger.debug(`route state=${route}`);
    if (html.dataset.staluxRoute !== route) html.dataset.staluxRoute = route;
    const main = document.querySelector("main[data-stalux-route]");
    if (main && main.getAttribute("data-stalux-route") !== route) {
        main.setAttribute("data-stalux-route", route);
    }
}

interface NavigationEvent {
    from: URL;
    to: URL;
    direction: string;
    navigationType?: string;
    loader: () => Promise<void>;
    newDocument: Document;
    signal: AbortSignal;
    viewTransition?: ViewTransition;
    sourceElement?: Element;
}

function setNavigationState(
    event: NavigationEvent,
    preset: RouteMotionPreset,
    html = document.documentElement,
): void {
    const from = getRouteKind(new URL(event.from, window.location.href).pathname);
    const to = getRouteKind(new URL(event.to, window.location.href).pathname);
    html.dataset.staluxVtFrom = from;
    html.dataset.staluxVtTo = to;
    html.dataset.staluxVtDirection = event.direction;
    html.dataset.staluxVtPreset = preset;
}

function clearNavigationState(): void {
    const html = document.documentElement;
    delete html.dataset.staluxVtFrom;
    delete html.dataset.staluxVtTo;
    delete html.dataset.staluxVtDirection;
    delete html.dataset.staluxVtPreset;
    clearFocusVisibility();
}

function clearFocusVisibility(): void {
    document
        .querySelector("[data-stalux-motion-focus]")
        ?.removeAttribute?.("data-stalux-motion-visible");
}

/** At most one bounded title is considered, never an entire article or list. */
function updateFocusVisibility(): void {
    const focus = document.querySelector<HTMLElement>("[data-stalux-motion-focus]");
    if (!focus || typeof focus.getBoundingClientRect !== "function") return;
    const rect = focus.getBoundingClientRect();
    const visible =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.height <= window.innerHeight / 2 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth;
    focus.dataset.staluxMotionVisible = String(visible);
}

function preserveHeaderMetrics(nextDocument: Document): void {
    const selector = '[data-astro-transition-persist="stalux-site-header"]';
    if (!document.querySelector(selector) || !nextDocument.querySelector(selector)) return;
    // The header DOM persists. Keep its measured dimensions through Astro's root
    // attribute swap instead of invalidating inherited layout variables twice.
    for (const property of ["--stalux-nav-offset", "--stalux-site-header-height"]) {
        const value = document.documentElement.style.getPropertyValue(property);
        if (value && !nextDocument.documentElement.style.getPropertyValue(property)) {
            nextDocument.documentElement.style.setProperty(property, value);
        }
    }
}

const transitionWindow = window as TransitionWindow;
if (!transitionWindow.__STALUX_VT_LISTENER__) {
    transitionWindow.__STALUX_VT_LISTENER__ = true;
    let pendingNavigation = 0;
    let swappedNavigation = 0;

    // A current-page link is not a page replacement. Intercept before Astro's
    // delegated handler, but keep propagation for menu cleanup and click tracking.
    // During preparation, Astro must receive it to cancel an incoming route.
    // Hash changes, explicit reloads, downloads and modified/new-tab clicks keep
    // their native behavior.
    document.addEventListener(
        "click",
        (event) => {
            if (
                pendingNavigation !== 0 ||
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            )
                return;
            const anchor =
                event.target instanceof Element
                    ? event.target.closest<HTMLAnchorElement>("a[href]")
                    : null;
            if (
                !anchor ||
                anchor.href !== window.location.href ||
                anchor.href.includes("#") ||
                anchor.hasAttribute("download") ||
                anchor.hasAttribute("data-astro-reload") ||
                anchor.relList.contains("external")
            )
                return;
            const target =
                anchor.getAttribute("target") ??
                document.querySelector("base[target]")?.getAttribute("target");
            if (!target || target === "_self") event.preventDefault();
        },
        { capture: true },
    );

    let generation = 0;
    let pendingBrowserMotion = false;
    let preset: RouteMotionPreset = "none";
    let motion: RouteMotion | undefined;
    window.addEventListener(
        "popstate",
        (event) => {
            pendingBrowserMotion =
                (event as PopStateEvent & { hasUAVisualTransition?: boolean })
                    .hasUAVisualTransition === true;
        },
        { capture: true },
    );
    document.addEventListener("astro:before-preparation", (event) => {
        const navigation = event as unknown as NavigationEvent;
        const current = ++generation;
        pendingNavigation = current;
        const cancelPreparation = () => {
            if (current !== generation) return;
            pendingNavigation = 0;
            clearNavigationState();
        };
        motion?.cancel();
        // Only the incoming heading animates. Drop any prior marker without
        // measuring/capturing a hidden outgoing title or flushing its layout.
        clearFocusVisibility();
        preset = getRouteMotionPreset({
            from: new URL(navigation.from, window.location.href),
            to: new URL(navigation.to, window.location.href),
            navigationType: navigation.navigationType,
            intent:
                navigation.sourceElement
                    ?.closest("[data-stalux-motion]")
                    ?.getAttribute("data-stalux-motion") ?? undefined,
            reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
            browserMotion: pendingBrowserMotion && navigation.navigationType === "traverse",
            hidden: document.hidden,
        });
        pendingBrowserMotion = false;
        setNavigationState(navigation, preset);
        navigation.signal.addEventListener("abort", cancelPreparation, { once: true });
        if (navigation.signal.aborted) cancelPreparation();
        queueMicrotask(() => {
            if (event.defaultPrevented) cancelPreparation();
        });
        const loader = navigation.loader;
        navigation.loader = async () => {
            try {
                await loader();
                if (event.defaultPrevented) cancelPreparation();
                else {
                    await prepareNavigationFont(navigation.newDocument, navigation.signal);
                }
            } catch (error) {
                cancelPreparation();
                throw error;
            }
        };
    });

    document.addEventListener("astro:before-swap", (event) => {
        const navigation = event as unknown as NavigationEvent;
        if (navigation.signal.aborted) return;
        const current = generation;
        swappedNavigation = current;
        preserveHeaderMetrics(navigation.newDocument);
        // Astro replaces the root attributes during swap. Carry state into the
        // new document; CSS keyframes read these data-* attributes to pick their
        // own direction rather than letting Astro's default `fade` pair apply.
        setNavigationState(navigation, preset, navigation.newDocument.documentElement);
        // This release uses CSS/native VT only. Settle the existing installation
        // gate without starting a second WAAPI effect; analytics/background keep
        // the same shared ready/finished semantics and their existing listeners.
        motion = prepareRouteMotion(navigation);
        motion.start(null, { skip: true });
        const finish = () => {
            if (current === generation) clearNavigationState();
        };
        // Native ready starts the animation. Keep selectors until it finishes,
        // including fallback/skip and abort; an older navigation cannot clear a
        // newer one's state.
        void motion.finished.then(finish, finish);
    });

    document.addEventListener("astro:after-swap", () => {
        setRouteState(window.location.pathname);
        if (preset !== "none") updateFocusVisibility();
    });

    document.addEventListener("astro:page-load", () => {
        // A previous route's scripts can finish while a newer loader is pending.
        if (swappedNavigation === generation) pendingNavigation = 0;
        setRouteState(window.location.pathname);
    });

    // Footer button and scroll sentinel persist across soft navigations, so the
    // BackToTop observer is installed once per document.
    installBackToTop();
}

setRouteState(window.location.pathname);
