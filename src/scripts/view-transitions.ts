import { getRouteKind } from "@utils/public-routes";
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
}

const ARTICLE_TEXT_BLOCK_LIMIT = 10;
const ARTICLE_TEXT_BLOCK_TAGS = new Set(["H2", "H3", "P", "BLOCKQUOTE"]);

function setArticleTextTransitions(root: ParentNode, enabled: boolean): void {
    const bodies = root.querySelectorAll<HTMLElement>(".stalux-post-body");

    for (const body of bodies) {
        for (const oldBlock of body.querySelectorAll<HTMLElement>(
            ":scope > [data-stalux-article-text-transition]",
        )) {
            oldBlock.style.removeProperty("view-transition-name");
            delete oldBlock.dataset.staluxArticleTextTransition;
        }

        if (!enabled) continue;

        const tagIndexes = new Map<string, number>();
        let namedBlocks = 0;
        for (const block of body.children) {
            if (!ARTICLE_TEXT_BLOCK_TAGS.has(block.tagName)) continue;
            const tag = block.tagName.toLowerCase();
            const index = tagIndexes.get(tag) ?? 0;
            tagIndexes.set(tag, index + 1);
            block.setAttribute("data-stalux-article-text-transition", "");
            (block as HTMLElement).style.setProperty(
                "view-transition-name",
                `stalux-article-text-${tag}-${index}`,
            );
            namedBlocks += 1;
            if (namedBlocks >= ARTICLE_TEXT_BLOCK_LIMIT) break;
        }
    }
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
        const navigation = event as unknown as NavigationEvent;
        setNavigationState(navigation);
        const loader = navigation.loader;
        navigation.loader = async () => {
            await loader();
            if (!event.defaultPrevented) {
                const fromRoute = getRouteKind(
                    new URL(navigation.from, window.location.href).pathname,
                );
                const toRoute = getRouteKind(new URL(navigation.to, window.location.href).pathname);
                if (fromRoute === "article") {
                    setArticleTextTransitions(document, toRoute === "article");
                }
                setArticleTextTransitions(navigation.newDocument, toRoute === "article");
                await prepareNavigationFont(navigation.newDocument, navigation.signal);
            }
        };
    });

    document.addEventListener("astro:after-swap", () => {
        setRouteState(window.location.pathname);
    });

    document.addEventListener("astro:page-load", () => {
        setRouteState(window.location.pathname);
        setArticleTextTransitions(document, getRouteKind(window.location.pathname) === "article");
        delete document.documentElement.dataset.staluxVtFrom;
        delete document.documentElement.dataset.staluxVtTo;
        delete document.documentElement.dataset.staluxVtDirection;
    });
}

setRouteState(window.location.pathname);
setArticleTextTransitions(document, getRouteKind(window.location.pathname) === "article");
