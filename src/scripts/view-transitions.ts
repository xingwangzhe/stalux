import { getRouteKind } from "@utils/view-transitions";

interface TransitionWindow extends Window {
    __STALUX_VT_LISTENER__?: boolean;
}

function setRouteState(pathname: string): void {
    const html = document.documentElement;
    const route = getRouteKind(pathname);
    html.dataset.staluxRoute = route;
    document.querySelector("main.stalux-main")?.setAttribute("data-stalux-route", route);
}

interface NavigationEvent {
    from: URL;
    to: URL;
    direction: string;
}

function setNavigationState(event: NavigationEvent): void {
    const from = getRouteKind(new URL(event.from, window.location.href).pathname);
    const to = getRouteKind(new URL(event.to, window.location.href).pathname);
    const html = document.documentElement;
    html.dataset.staluxVtFrom = from;
    html.dataset.staluxVtTo = to;
    html.dataset.staluxVtDirection = event.direction;
}

const transitionWindow = window as TransitionWindow;
if (!transitionWindow.__STALUX_VT_LISTENER__) {
    transitionWindow.__STALUX_VT_LISTENER__ = true;

    document.addEventListener("astro:before-preparation", (event) => {
        setNavigationState(event as NavigationEvent);
    });

    document.addEventListener("astro:after-swap", () => {
        setRouteState(window.location.pathname);
    });

    document.addEventListener("astro:page-load", () => {
        setRouteState(window.location.pathname);
        delete document.documentElement.dataset.staluxVtFrom;
        delete document.documentElement.dataset.staluxVtTo;
        delete document.documentElement.dataset.staluxVtDirection;
    });
}

setRouteState(window.location.pathname);
