import { getRouteKind } from "@utils/public-routes";
import { installBackToTop } from "./back-to-top";
import { createClientLogger } from "./logger";
import { prepareNavigationFont } from "./navigation-font";

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
}

function setNavigationState(event: NavigationEvent, html = document.documentElement): void {
    const from = getRouteKind(new URL(event.from, window.location.href).pathname);
    const to = getRouteKind(new URL(event.to, window.location.href).pathname);
    html.dataset.staluxVtFrom = from;
    html.dataset.staluxVtTo = to;
    html.dataset.staluxVtDirection = event.direction;
}

function clearNavigationState(): void {
    const html = document.documentElement;
    delete html.dataset.staluxVtFrom;
    delete html.dataset.staluxVtTo;
    delete html.dataset.staluxVtDirection;
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

    let generation = 0;
    let pendingBrowserMotion = false;
    let _browserMotion = false;
    let _routeMotionActive = false;
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
        _routeMotionActive = false;
        _browserMotion = pendingBrowserMotion && navigation.navigationType === "traverse";
        pendingBrowserMotion = false;
        setNavigationState(navigation);
        navigation.signal.addEventListener(
            "abort",
            () => {
                if (current === generation) clearNavigationState();
            },
            { once: true },
        );
        queueMicrotask(() => {
            if (event.defaultPrevented && current === generation) clearNavigationState();
        });
        const loader = navigation.loader;
        navigation.loader = async () => {
            await loader();
            if (!event.defaultPrevented) {
                await prepareNavigationFont(navigation.newDocument, navigation.signal);
            }
        };
    });

    document.addEventListener("astro:before-swap", (event) => {
        const navigation = event as unknown as NavigationEvent;
        if (navigation.signal.aborted) return;
        const current = generation;
        preserveHeaderMetrics(navigation.newDocument);
        _routeMotionActive = true;
        // Astro replaces the root attributes during swap. Carry state into the
        // new document; CSS keyframes read these data-* attributes to pick their
        // own direction rather than letting Astro's default `fade` pair apply.
        setNavigationState(navigation, navigation.newDocument.documentElement);
        const finish = () => {
            if (current === generation) clearNavigationState();
        };
        // ViewTransition.ready fires when pseudo-elements are painted out; we
        // use it as the handoff boundary so our WAAPI for new content starts
        // *after* the native swap has painted its snapshot.
        const native = navigation.viewTransition;
        Promise.resolve(native?.ready)
            .then(
                () => undefined,
                () => undefined,
            )
            .then(finish);
    });

    document.addEventListener("astro:after-swap", () => {
        setRouteState(window.location.pathname);
    });

    document.addEventListener("astro:page-load", () => {
        setRouteState(window.location.pathname);
    });

    // Footer button and scroll sentinel persist across soft navigations, so the
    // BackToTop observer is installed once per document.
    installBackToTop();
}

setRouteState(window.location.pathname);
