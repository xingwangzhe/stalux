declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
        __staluxAnalyticsLoaded?: boolean;
        __staluxAnalyticsPageLoadListener?: boolean;
    }
}

function load() {
    const gaID = document.body?.dataset.staluxGaId;
    if (!gaID) return;
    const hasScript = document.querySelector('script[data-stalux-google="true"]');
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
    if (!hasScript) {
        const script = document.createElement("script");
        script.async = true;
        script.dataset.staluxGoogle = "true";
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaID)}`;
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

export {};
