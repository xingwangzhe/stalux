import { getRouteKind } from "@utils/public-routes";
import { createClientLogger } from "./logger";
import { prepareNavigationFont } from "./navigation-font";
import { installNavigationProgress } from "./navigation-progress";

const logger = createClientLogger("view-transitions");

interface TransitionWindow extends Window {
    __STALUX_VT_LISTENER__?: boolean;
}

function setRouteState(pathname: string): void {
    const html = document.documentElement;
    const route = getRouteKind(pathname);
    logger.debug(`route state=${route}`);
    html.dataset.staluxRoute = route;
    document.querySelector("main.stalux-main")?.setAttribute("data-stalux-route", route);
}

interface NavigationEvent {
    from: URL;
    to: URL;
    direction: string;
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
    delete document.documentElement.dataset.staluxVtFrom;
    delete document.documentElement.dataset.staluxVtTo;
    delete document.documentElement.dataset.staluxVtDirection;
}

const transitionWindow = window as TransitionWindow;
if (!transitionWindow.__STALUX_VT_LISTENER__) {
    transitionWindow.__STALUX_VT_LISTENER__ = true;

    let generation = 0;
    document.addEventListener("astro:before-preparation", (event) => {
        const navigation = event as unknown as NavigationEvent;
        const current = ++generation;
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
        // Astro replaces the root attributes during swap. Carry motion state into
        // the new document and keep it until the last animation actually settles.
        setNavigationState(navigation, navigation.newDocument.documentElement);
        const finish = () => {
            if (current === generation) clearNavigationState();
        };
        void navigation.viewTransition?.finished.then(finish, finish);
    });

    document.addEventListener("astro:after-swap", () => {
        setRouteState(window.location.pathname);
    });

    document.addEventListener("astro:page-load", () => {
        setRouteState(window.location.pathname);
    });

    // Register after the font wrapper so prepared includes its bounded wait.
    installNavigationProgress();
}

setRouteState(window.location.pathname);
