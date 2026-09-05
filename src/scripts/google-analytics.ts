import { createClientLogger } from "./logger";

const logger = createClientLogger("google-analytics");

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
        __staluxAnalyticsLoaded?: boolean;
        __staluxAnalyticsPageLoadListener?: boolean;
        __staluxGoogleScriptLoaded?: boolean;
    }
}

function load() {
    const gaID = document.body?.dataset.staluxGaId;
    if (!gaID) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
    if (!window.__staluxGoogleScriptLoaded) {
        window.__staluxGoogleScriptLoaded = true;
        const script = document.createElement("script");
        script.async = true;
        script.dataset.staluxGoogle = "true";
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaID)}`;
        script.addEventListener("load", () => logger.debug("external script loaded"), {
            once: true,
        });
        script.addEventListener(
            "error",
            () => logger.warn("external script failed to load (network or content blocker)"),
            { once: true },
        );
        logger.debug("loading external script");
        document.head.appendChild(script);
    }
    if (!window.__staluxAnalyticsLoaded) {
        window.__staluxAnalyticsLoaded = true;
        window.gtag("js", new Date());
        window.gtag("config", gaID);
    }
}

if (!window.__staluxAnalyticsPageLoadListener) {
    window.__staluxAnalyticsPageLoadListener = true;
    let firstPageLoad = true;
    document.addEventListener("astro:page-load", () => {
        load();
        if (firstPageLoad) {
            firstPageLoad = false;
            return;
        }
        window.gtag?.("event", "page_view", { page_path: window.location.pathname });
    });
}

if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", load, { once: true });
else load();
