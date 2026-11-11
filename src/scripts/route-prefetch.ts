/**
 * Warm the main navigation routes after the homepage has settled.
 *
 * Swup already preloads hovered/focused links. This adds a low-priority,
 * idle-time preload of the visible navigation routes, so the first click from
 * the homepage can reuse Swup's page cache instead of fetching and parsing the
 * document during the transition. The preload plugin enforces its own throttle,
 * skips saveData/2G connections, deduplicates cached pages and ignores routes
 * the router cannot handle.
 */
import { createClientLogger } from "./logger";
import { registerPageLifecycle } from "./page-runtime";

const logger = createClientLogger("route-prefetch");

const AFTER_LOAD_DELAY_MS = 1000;
const LOAD_CEILING_MS = 2500;
const IDLE_TIMEOUT_MS = 2000;
/**
 * 首页导航有 6~8 个路由，全量预热在线上实测约 122KB（`/archives/` 单页 48KB）。
 * 只预热导航顺序最靠前的几条，把带宽留给用户当下的交互。
 */
const MAX_PREFETCH_ROUTES = 3;

export function collectMainRouteUrls(
    documentLike: Pick<Document, "querySelectorAll"> = document,
    current = new URL(window.location.href),
): string[] {
    const urls = new Set<string>();
    for (const anchor of documentLike.querySelectorAll<HTMLAnchorElement>(
        'a[data-ref="stalux-nav-link"]',
    )) {
        let url: URL;
        try {
            url = new URL(anchor.href, current);
        } catch {
            continue;
        }
        if (url.origin !== current.origin) continue;
        if (url.pathname === current.pathname && url.search === current.search) continue;
        urls.add(`${url.pathname}${url.search}`);
    }
    return [...urls];
}

export function mountRoutePrefetch(): (() => void) | undefined {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (document.documentElement.dataset.staluxRoute !== "home") return;
    const reducedData = window.matchMedia?.("(prefers-reduced-data: reduce)");
    if (reducedData?.matches) return;

    let cancelled = false;
    let scheduled = false;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let ceilingTimer: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    const run = () => {
        if (cancelled || document.hidden) return;
        const swup = window.swup;
        if (!swup || typeof swup.preload !== "function") {
            logger.debug("swup preload API unavailable; skipping route prefetch");
            return;
        }
        const urls = collectMainRouteUrls().slice(0, MAX_PREFETCH_ROUTES);
        if (!urls.length) return;
        logger.debug(`prefetching ${urls.length} main routes`);
        // One document at a time: keep the prefetch invisible to the current
        // page's main thread and network instead of parsing six documents at once.
        let chain: Promise<unknown> = Promise.resolve();
        for (const url of urls) {
            chain = chain
                .then(() => {
                    if (cancelled) return;
                    return swup.preload?.(url, { priority: false });
                })
                .catch(() => {
                    // A failed warm-up must never affect navigation.
                });
        }
        void chain;
    };

    const requestIdle = () => {
        if (cancelled) return;
        const idle = window.requestIdleCallback;
        if (typeof idle === "function") {
            idleId = idle(run, { timeout: IDLE_TIMEOUT_MS });
            return;
        }
        idleId = setTimeout(run, 1) as unknown as number;
    };

    const schedule = () => {
        if (scheduled || cancelled) return;
        scheduled = true;
        delayTimer = setTimeout(requestIdle, AFTER_LOAD_DELAY_MS);
    };

    if (document.readyState === "complete") {
        schedule();
    } else {
        const onLoad = () => {
            window.removeEventListener("load", onLoad);
            schedule();
        };
        window.addEventListener("load", onLoad, { once: true });
        // A slow image or third-party request must not postpone the warm-up forever.
        ceilingTimer = setTimeout(() => {
            window.removeEventListener("load", onLoad);
            schedule();
        }, LOAD_CEILING_MS);
    }

    return () => {
        cancelled = true;
        if (delayTimer !== undefined) clearTimeout(delayTimer);
        if (ceilingTimer !== undefined) clearTimeout(ceilingTimer);
        if (idleId === undefined) return;
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
        else clearTimeout(idleId);
    };
}

registerPageLifecycle("route-prefetch", mountRoutePrefetch);
