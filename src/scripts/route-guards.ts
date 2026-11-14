/**
 * The three correctness guards `@swup/astro` cannot express as options.
 *
 * `@swup/astro` builds and owns the Swup instance, so the theme attaches these
 * as hooks on `window.swup` instead of writing its own `new Swup({...})`:
 *
 * 1. Page scripts run once per session (analytics SDKs must not be replayed)
 *    but new pages must still boot their own modules.
 * 2. A superseded visit may be revived by swup's post-abort state reset and
 *    would then replace the page the reader is already looking at.
 * 3. The head plugin keeps old stylesheets readable while the incoming sheet
 *    loads; whoever put them there has to remove the ones the new page does
 *    not use, or a long session grows the head without bound.
 */
import type Swup from "swup";
import type { Visit } from "swup";
import { getRouteKind } from "../utils/public-routes";
import { installBackToTop } from "./back-to-top";
import "./navigation-client";
import { prepareNavigationFont } from "./navigation-font";
import { prepareNavigationScripts } from "./navigation-scripts";
import { hydrateShells, markRetainedShells } from "./shell-hydration";

const MAIN = "#swup-main";
const MAX_CACHED_PAGES = 32;

/** Theme-authored styles for the page on screen, and the ones it does not share. */
let authoredStyles: Element[] = [];
let obsoleteStyles: Element[] = [];

const runners = new WeakMap<Visit, () => Promise<void>>();
const scripts = new WeakMap<Visit, Promise<void>>();
const controllers = new WeakMap<Visit, AbortController>();

let installed = false;

/**
 * Swup marks a superseded visit aborted, but its awaited `visit:start` chain
 * still resumes and resets the state to `started`, reviving it. Aborting again
 * at the transition boundary stops the rest of its chain: every hook handler
 * and the default renderer are skipped for a done visit.
 */
function abortSuperseded(swup: Swup, visit: Visit): void {
    if (visit !== swup.visit) visit.abort();
}

function abortScripts(visit: Visit): void {
    controllers.get(visit)?.abort();
}

function setRoute(visit: Visit): void {
    const route = visit.to.route ?? getRouteKind(visit.to.url);
    document.documentElement.dataset.staluxRoute = route;
    document.querySelector(MAIN)?.setAttribute("data-stalux-route", route);
}

/** Capture what belongs to the outgoing page while it is still on screen. */
async function prepare(visit: Visit): Promise<void> {
    const next = visit.to.document;
    if (!next) return;
    markRetainedShells();
    const incoming = [...next.head.querySelectorAll("style,link[rel=stylesheet]")];
    obsoleteStyles = authoredStyles.filter(
        (element) => !incoming.some((other) => element.isEqualNode(other)),
    );
    const controller = new AbortController();
    controllers.set(visit, controller);
    // The destination page's body font gets a bounded head start so the first
    // painted frame is already in the right face; a slow font never blocks.
    await prepareNavigationFont(next, controller.signal);
    // Resolved against the target URL: the parsed document has no usable base.
    const baseUrl = new URL(visit.to.url, window.location.origin).href;
    const run = prepareNavigationScripts(next, { baseUrl });
    runners.set(visit, () => {
        const started = run(controller.signal);
        scripts.set(visit, started);
        return started;
    });
}

/** Bring the incoming page's own content and assets online. */
function settle(visit: Visit): void {
    const next = visit.to.document;
    // A link navigation always lands at the top. Doing it here, before
    // `astro:after-swap` and before any page script runs, keeps every later
    // measurement (shell slots, list reveals) on the final scroll position
    // instead of the one the outgoing page left behind. History entries and
    // hash targets keep whatever position the browser restores.
    if (
        !(visit.history.popstate || visit.to.hash) &&
        (window.scrollY !== 0 || window.scrollX !== 0)
    ) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    // Kept shells take the incoming lists before any page module mounts.
    hydrateShells(next);
    for (const element of obsoleteStyles) element.remove();
    obsoleteStyles = [];
    // Only styles the incoming page also has stay tracked: anything a live SDK
    // injected is not authored by the theme and must never be pruned.
    const incoming = [...(next?.head.querySelectorAll("style,link[rel=stylesheet]") ?? [])];
    authoredStyles = [...document.head.querySelectorAll("style,link[rel=stylesheet]")].filter(
        (element) => incoming.some((other) => element.isEqualNode(other)),
    );
    setRoute(visit);
    // `@swup/astro` always turns on the route-name plugin's `paths` classes
    // (`from-*` / `to-*` on <html>) when routes are configured, and the plugin
    // only ever removes `from-*`. Clearing both here keeps the document element
    // from collecting one `to-*` class per visited page.
    for (const name of [...document.documentElement.classList]) {
        if (name.startsWith("to-") || name.startsWith("from-")) {
            document.documentElement.classList.remove(name);
        }
    }
    runners.get(visit)?.();
}

function install(swup: Swup): void {
    if (installed) return;
    installed = true;
    authoredStyles = [...document.head.querySelectorAll("style,link[rel=stylesheet]")];
    // The instance's first visit is created with an empty URL, so the current
    // route comes from the document instead.
    document.documentElement.dataset.staluxRoute = getRouteKind(window.location.pathname);
    swup.hooks.before("visit:transition", (visit) => abortSuperseded(swup, visit), {
        priority: -1000,
    });
    // `visit:transition` runs only after the target document has been fetched, so
    // a burst of clicks queues several fetches and the oldest one wins the race:
    // the reader ends up on the second link they clicked, not the last. Retire
    // the previous visit the moment a newer one starts.
    let previous: Visit | undefined;
    swup.hooks.on("visit:start", (visit) => {
        if (previous && previous !== visit && !previous.done) previous.abort();
        previous = visit;
    });
    swup.hooks.on("visit:abort", abortScripts);
    swup.hooks.on("visit:fail", abortScripts);
    swup.hooks.before("content:replace", prepare, { priority: -1000 });
    swup.hooks.on("content:replace", settle, { priority: -1000 });
    // `@swup/astro` dispatches `astro:page-load` from its own `page:view`
    // handler, so the page scripts have to be live before it runs.
    swup.hooks.on(
        "page:view",
        async (visit) => {
            await scripts.get(visit);
        },
        { priority: -1000 },
    );
    // The cache is a session-long map of parsed documents.
    swup.hooks.on("cache:set", () => {
        while (swup.cache.size > MAX_CACHED_PAGES) {
            const oldest = swup.cache.all.keys().next();
            if (oldest.done) break;
            swup.cache.delete(oldest.value);
        }
    });

    if (import.meta.env.DEV) {
        void import("virtual:stalux-swup-debug")
            .then(({ default: Debug }) => {
                if (Debug) swup.use(new Debug());
            })
            .catch(() => {
                // The debug plugin is an optional devDependency.
            });
    }
}

// Neither of these needs the Swup instance, and both are expected on the very
// first document: doing them here keeps them off the instance that
// `@swup/astro` may still be creating.
installBackToTop();
// Astro dispatches `astro:page-load` for the first document; the swup
// integration only dispatches it after a visit.
const initialLoad = () => document.dispatchEvent(new Event("astro:page-load"));
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialLoad, { once: true });
} else queueMicrotask(initialLoad);

/**
 * Attach the guards to the instance `@swup/astro` created.
 *
 * The init script is injected by the swup integration and this module by the
 * theme's own, so the evaluation order is not guaranteed. If the instance is
 * not there yet, the first hook event swup dispatches installs the guards.
 */
export function installRouteGuards(): void {
    if (window.swup) {
        install(window.swup);
        return;
    }
    document.addEventListener(
        "swup:any",
        () => {
            if (window.swup) install(window.swup);
        },
        { once: true },
    );
}
