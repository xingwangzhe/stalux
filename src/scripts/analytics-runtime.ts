/** Async native SDKs keep live DOM events out of worker proxies during Astro swaps. */

import { createClientLogger } from "./logger";

const logger = createClientLogger("analytics");

declare global {
    interface Window {
        __staluxAnalyticsRuntime?: {
            installed?: boolean;
            native?: boolean;
            revision?: number;
            scripts?: Map<string, Promise<void>>;
            googleId?: string;
            googleInitialized?: boolean;
            clarityId?: string;
            previousPage?: string;
        };
    }
}

type AnalyticsHost = Window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & { q: unknown[] };
    umami?: { track: (payload: Record<string, unknown>) => unknown };
};
const host = window as AnalyticsHost;
window.__staluxAnalyticsRuntime ??= {};
const state = window.__staluxAnalyticsRuntime;
state.scripts ??= new Map();

/** Never await analytics in a router callback; failed loads can retry on a later page. */
function loadTrackerScript(src: string, attributes: Record<string, string> = {}): Promise<void> {
    const existing = state.scripts?.get(src);
    if (existing) return existing;
    const script = document.createElement("script");
    script.async = true;
    script.fetchPriority = "low";
    script.src = src;
    for (const [name, value] of Object.entries(attributes)) script.setAttribute(name, value);
    const loaded = new Promise<void>((resolve, reject) => {
        const finish = (error?: Error) => {
            clearTimeout(timer);
            script.onload = null;
            script.onerror = null;
            if (error) {
                script.remove();
                reject(error);
            } else resolve();
        };
        const timer = setTimeout(() => finish(new Error("Analytics SDK load timed out")), 15_000);
        script.onload = () => finish();
        script.onerror = () => finish(new Error("Analytics SDK load failed"));
        document.head.appendChild(script);
    });
    state.scripts?.set(src, loaded);
    void loaded.catch(() => {
        if (state.scripts?.get(src) === loaded) state.scripts.delete(src);
    });
    return loaded;
}

function initializeTrackers(): void {
    const config = document.body?.dataset;
    if (!config) return;
    if (config.staluxGaId) {
        if (state.googleId !== config.staluxGaId) state.googleInitialized = false;
        state.googleId = config.staluxGaId;
        host.dataLayer ??= [];
        host.gtag ??= function (..._args: unknown[]) {
            // biome-ignore lint/complexity/noArguments: Match the official gtag queue format.
            host.dataLayer?.push(arguments);
        };
        if (!state.googleInitialized) {
            state.googleInitialized = true;
            host.gtag("js", new Date());
            host.gtag("config", state.googleId, { send_page_view: false });
        }
        void loadTrackerScript(
            `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(state.googleId)}`,
            { "data-stalux-google": "true" },
        ).catch(() => logger.debug("Google SDK unavailable; queued events retained"));
    }
    if (config.staluxClarityId && state.clarityId !== config.staluxClarityId) {
        host.clarity ??= Object.assign(
            function (..._args: unknown[]) {
                // biome-ignore lint/complexity/noArguments: Match the official Clarity queue format.
                host.clarity?.q.push(arguments);
            },
            { q: [] as unknown[] },
        );
        const id = config.staluxClarityId;
        state.clarityId = id;
        void loadTrackerScript(`https://www.clarity.ms/tag/${encodeURIComponent(id)}`, {
            "data-stalux-clarity": "true",
        }).catch(() => {
            if (state.clarityId === id) state.clarityId = undefined;
            logger.debug("Clarity SDK unavailable; a later navigation can retry");
        });
    }
}

function trackGooglePage(): void {
    if (!state.googleId) return;
    host.gtag?.("event", "page_view", {
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
    });
}

function trackUmamiPage(): void {
    const config = document.body?.dataset;
    if (!config?.staluxUmamiId || !config.staluxUmamiUrl) return;
    // Snapshot now: a slow SDK must not attribute every queued visit to the last URL.
    const payload = {
        website: config.staluxUmamiId,
        url: window.location.href,
        title: document.title,
        hostname: window.location.hostname,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        referrer: state.previousPage ?? document.referrer,
    };
    void loadTrackerScript(config.staluxUmamiUrl, {
        "data-stalux-umami": "true",
        "data-website-id": config.staluxUmamiId,
        // Keep SDK click/performance features; only pageviews belong to Astro's lifecycle.
        "data-auto-pageview": "false",
    })
        .then(() => host.umami?.track(payload))
        .catch(() => logger.debug("Umami SDK unavailable; navigation remains usable"));
}

function trackVercountPage(): void {
    document.querySelector("script[data-stalux-vercount]")?.remove();
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://events.vercount.one/js";
    script.dataset.staluxVercount = "true";
    document.head.appendChild(script);
}

if (state.installed && (!state.native || state.revision !== 2)) {
    // An open tab can cross a deployment boundary. Its old anonymous worker
    // listeners cannot be detached safely; reload once to install the new runtime.
    window.location.reload();
} else if (!state.installed) {
    state.native = true;
    state.revision = 2;
    state.installed = true;
    document.addEventListener("astro:page-load", () => {
        initializeTrackers();
        trackGooglePage();
        trackUmamiPage();
        trackVercountPage();
        state.previousPage = window.location.href;
    });
}
