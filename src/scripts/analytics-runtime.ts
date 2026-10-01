/**
 * Keep analytics trackers in Partytown. This small main-thread bridge owns the
 * Astro navigation lifecycle and tells the worker about each completed page.
 */
declare global {
    interface Window {
        __staluxAnalyticsRuntime?: {
            installed?: boolean;
            googleId?: string;
            googleInitialized?: boolean;
            clarityId?: string;
            umamiKey?: string;
            previousPage?: string;
        };
    }
}

window.__staluxAnalyticsRuntime ??= {};
const state = window.__staluxAnalyticsRuntime;

function appendWorkerInline(code: string): void {
    const script = document.createElement("script");
    script.type = "text/partytown";
    script.textContent = code;
    document.head.appendChild(script);
    window.dispatchEvent(new CustomEvent("ptupdate"));
}

function appendWorkerScript(src: string, attributes: Record<string, string> = {}): void {
    const script = document.createElement("script");
    script.type = "text/partytown";
    script.src = src;
    for (const [name, value] of Object.entries(attributes)) script.setAttribute(name, value);
    document.head.appendChild(script);
    window.dispatchEvent(new CustomEvent("ptupdate"));
}

function initializeTrackers(): void {
    const config = document.body?.dataset;
    if (!config) return;

    if (config.staluxGaId) {
        state.googleId = config.staluxGaId;
    }

    if (config.staluxClarityId && state.clarityId !== config.staluxClarityId) {
        state.clarityId = config.staluxClarityId;
        appendWorkerInline(`
            window.clarity = window.clarity || function () {
                (window.clarity.q = window.clarity.q || []).push(arguments);
            };
            window.clarity.q = window.clarity.q || [];
        `);
        appendWorkerScript(`https://www.clarity.ms/tag/${encodeURIComponent(state.clarityId)}`, {
            "data-stalux-clarity": "true",
        });
    }

    if (
        config.staluxUmamiId &&
        config.staluxUmamiUrl &&
        state.umamiKey !== `${config.staluxUmamiId}\n${config.staluxUmamiUrl}`
    ) {
        state.umamiKey = `${config.staluxUmamiId}\n${config.staluxUmamiUrl}`;
        appendWorkerScript(config.staluxUmamiUrl, {
            "data-stalux-umami": "true",
            "data-website-id": config.staluxUmamiId,
            "data-auto-pageview": "false",
        });
    }
}

function trackGooglePage(): void {
    if (!state.googleId) return;
    const page = {
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
    };
    const initialize = !state.googleInitialized;
    state.googleInitialized = true;
    appendWorkerInline(`
        // Partytown 0.14 serializes HTMLCollection as its worker NodeList.
        // GA user-data detection checks instanceof HTMLCollection before sending page_view.
        window.HTMLCollection = window.HTMLCollection || window.NodeList;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        ${initialize ? `window.gtag("js", new Date());window.gtag("config", ${JSON.stringify(state.googleId)}, { send_page_view: false });` : ""}
        window.gtag("event", "page_view", ${JSON.stringify(page)});
    `);
    if (initialize)
        appendWorkerScript(
            `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(state.googleId)}`,
            { "data-stalux-google": "true" },
        );
}

function trackUmamiPage(): void {
    const id = document.body?.dataset.staluxUmamiId;
    if (!id || !state.umamiKey) return;
    const payload = JSON.stringify({
        website: id,
        url: window.location.href,
        title: document.title,
        hostname: window.location.hostname,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        referrer: state.previousPage ?? document.referrer,
    });
    appendWorkerInline(`
        (function send(attempt) {
            if (window.umami?.track) window.umami.track(${payload});
            else if (attempt < 50) setTimeout(() => send(attempt + 1), 100);
        })(0);
    `);
}

function trackVercountPage(): void {
    // Visible counters need the current window's URL, cookie and DOM nodes.
    // Avoid worker startup and synchronous DOM bridges; bind fresh nodes once
    // per completed Astro navigation using the small upstream async script.
    document.querySelector("script[data-stalux-vercount]")?.remove();
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://events.vercount.one/js";
    script.dataset.staluxVercount = "true";
    document.head.appendChild(script);
}

if (!state.installed) {
    state.installed = true;
    let sandbox: HTMLIFrameElement | undefined;
    // Moving an iframe with append() reloads its browsing context. Park it outside
    // the replaced body with moveBefore(), which preserves the running worker.
    // Capture runs before @astrojs/partytown's iframe recreation handler.
    document.addEventListener(
        "astro:before-swap",
        () => {
            const frame = document.body.querySelector<HTMLIFrameElement>(
                'iframe[src*="~partytown/"]',
            );
            if (frame && typeof document.documentElement.moveBefore === "function") {
                sandbox = frame;
                document.documentElement.moveBefore(frame, null);
            } else if (!window.crossOriginIsolated) {
                // Atomics mode has no sandbox iframe and keeps its worker alive.
                state.googleInitialized = false;
                state.clarityId = undefined;
                state.umamiKey = undefined;
            }
        },
        true,
    );
    document.addEventListener("astro:after-swap", () => {
        if (sandbox) {
            document.body.moveBefore(sandbox, null);
            sandbox = undefined;
        }
    });
    document.addEventListener("astro:page-load", () => {
        initializeTrackers();
        trackGooglePage();
        trackUmamiPage();
        trackVercountPage();
        state.previousPage = window.location.href;
    });
}

export {};
