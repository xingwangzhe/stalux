/** Async native SDKs keep live DOM events out of worker proxies during Astro swaps. */

import { createClientLogger } from "./logger";
import { prepareRouteMotion, type RouteMotionEvent } from "./route-motion";

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
    clarity?: ((...args: unknown[]) => void) & { v?: string };
    umami?: { track: (payload: Record<string, unknown>) => unknown };
};
const host = window as AnalyticsHost;
window.__staluxAnalyticsRuntime ??= {};
const state = window.__staluxAnalyticsRuntime;
state.scripts ??= new Map();

type GooglePage = {
    ready: Promise<unknown>;
    payload: {
        page_location: string;
        page_path: string;
        page_title: string;
        page_referrer: string;
    };
};
const googlePages: GooglePage[] = [];
let transitionReady: Promise<unknown> = Promise.resolve();
let googleScheduled = false;
let googleSchedule = 0;
let googleTimer: ReturnType<typeof setTimeout> | undefined;
let googleFrames: number[] = [];

function cancelGoogleSchedule(): void {
    googleSchedule++;
    googleScheduled = false;
    clearTimeout(googleTimer);
    for (const frame of googleFrames) window.cancelAnimationFrame(frame);
    googleFrames = [];
}

function sendGooglePage(page: GooglePage): void {
    try {
        host.gtag?.("event", "page_view", page.payload);
    } catch {
        logger.debug("Google page view unavailable; navigation remains usable");
    }
}

/** The loaded Google SDK processes dataLayer.push synchronously and can read layout. */
function scheduleGooglePages(): void {
    const page = googlePages[0];
    if (!page || googleScheduled) return;
    googleScheduled = true;
    const schedule = ++googleSchedule;
    const run = () => {
        if (schedule !== googleSchedule) return;
        cancelGoogleSchedule();
        const next = googlePages.shift();
        if (next) sendGooglePage(next);
        // A burst of visits stays FIFO, with a separate task for each SDK call.
        scheduleGooglePages();
    };
    // A queued visit can outlive its own transition. Also wait for whichever
    // incoming snapshot is current when this task is scheduled.
    void Promise.all([page.ready, transitionReady]).then(() => {
        if (schedule !== googleSchedule) return;
        // Let the routed content paint after native rendering resumes and its own
        // motion is installed. The timer also covers throttled/background frames.
        googleTimer = setTimeout(run, 1000);
        googleFrames.push(
            window.requestAnimationFrame(() => {
                if (schedule !== googleSchedule) return;
                googleFrames.push(
                    window.requestAnimationFrame(() => {
                        if (schedule !== googleSchedule) return;
                        const scheduler = (
                            window as Window & {
                                scheduler?: {
                                    postTask: (
                                        callback: () => void,
                                        options: { priority: "background" },
                                    ) => Promise<unknown>;
                                };
                            }
                        ).scheduler;
                        if (scheduler?.postTask) {
                            void scheduler.postTask(run, { priority: "background" }).catch(() => {
                                if (schedule === googleSchedule) setTimeout(run, 0);
                            });
                        } else setTimeout(run, 0);
                    }),
                );
            }),
        );
    });
}

function flushGooglePages(): void {
    cancelGoogleSchedule();
    // Native gtag remains on the main thread for GA's own pagehide/engagement work.
    // Do not leave a queued view behind when the document is hidden or unloaded.
    for (const page of googlePages.splice(0)) sendGooglePage(page);
}

/** Monitor only a script created by this integration; a loaded tag stays intact. */
function monitorTrackerScript(script: HTMLScriptElement, append = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let settled = false;
        const finish = (error?: Error) => {
            if (settled) return;
            settled = true;
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
        if (append) document.head.appendChild(script);
    });
}

/** Never await analytics in a router callback; failed loads can retry on a later page. */
function loadTrackerScript(src: string, attributes: Record<string, string> = {}): Promise<void> {
    const existing = state.scripts?.get(src);
    if (existing) return existing;
    const script = document.createElement("script");
    script.async = true;
    script.fetchPriority = "low";
    script.src = src;
    for (const [name, value] of Object.entries(attributes)) script.setAttribute(name, value);
    const loaded = monitorTrackerScript(script, true);
    state.scripts?.set(src, loaded);
    void loaded.catch(() => {
        if (state.scripts?.get(src) === loaded) state.scripts.delete(src);
    });
    return loaded;
}

const CLARITY_SCRIPT_ID = "clarity-script";
const CLARITY_LOADER_KEY = "clarity:npm";

function hasExistingClarity(): boolean {
    return Boolean(
        host.clarity?.v ||
            document.getElementById(CLARITY_SCRIPT_ID) ||
            document.querySelector(
                'script[data-stalux-clarity],script[src^="https://www.clarity.ms/tag/"]',
            ),
    );
}

function initializeClarity(id: string): void {
    if (state.clarityId === id || state.scripts?.has(CLARITY_LOADER_KEY)) return;
    state.clarityId = id;
    // A preceding SDK or user-provided tag owns its own lifecycle. Never create
    // a second loader or attach destructive retry handlers to that script.
    if (hasExistingClarity()) return;
    const initialized = import("@microsoft/clarity").then(({ default: clarity }) => {
        // Another integration may have installed its tag while this chunk loaded.
        if (hasExistingClarity()) return;
        clarity.init(id);
        const script = document.getElementById(CLARITY_SCRIPT_ID);
        // Official init returns void and catches its own exceptions. Its inserted
        // element is the observable loader, not the return value of init().
        if (script?.tagName !== "SCRIPT") {
            throw new Error("Clarity did not create its loader");
        }
        const tracker = script as HTMLScriptElement;
        tracker.dataset.staluxClarity = "true";
        tracker.fetchPriority = "low";
        // Tag load does not establish that its remote core or collector is ready.
        return monitorTrackerScript(tracker);
    });
    state.scripts?.set(CLARITY_LOADER_KEY, initialized);
    void initialized.catch(() => {
        if (state.scripts?.get(CLARITY_LOADER_KEY) !== initialized) return;
        state.scripts.delete(CLARITY_LOADER_KEY);
        if (state.clarityId === id) state.clarityId = undefined;
        logger.debug("Clarity loader unavailable; a later navigation can retry");
    });
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
    if (config.staluxClarityId) initializeClarity(config.staluxClarityId);
}

function trackGooglePage(): void {
    if (!state.googleId) return;
    // Capture the visit before yielding: another navigation must not replace its
    // URL, title or virtual referrer while the SDK is waiting for its task.
    googlePages.push({
        ready: transitionReady,
        payload: {
            page_location: window.location.href,
            page_path: window.location.pathname + window.location.search,
            page_title: document.title,
            page_referrer: state.previousPage ?? document.referrer,
        },
    });
    scheduleGooglePages();
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

if (state.installed && (!state.native || state.revision !== 4)) {
    // Revision 4 replaces synchronous Google page views and the motion policy.
    // An open tab can cross a deployment boundary. Its old anonymous worker
    // listeners cannot be detached safely; reload once to install the new runtime.
    window.location.reload();
} else if (!state.installed) {
    state.native = true;
    state.revision = 4;
    state.installed = true;
    document.addEventListener("astro:before-swap", (event) => {
        transitionReady = prepareRouteMotion(event as Event & RouteMotionEvent).ready;
        // Invalidate an older page's frames, timer and posted task before this
        // incoming snapshot starts. Its captured visit remains in the FIFO.
        cancelGoogleSchedule();
        scheduleGooglePages();
    });
    window.addEventListener("pagehide", flushGooglePages);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) flushGooglePages();
    });
    document.addEventListener("astro:page-load", () => {
        initializeTrackers();
        trackGooglePage();
        trackUmamiPage();
        trackVercountPage();
        state.previousPage = window.location.href;
    });
}
