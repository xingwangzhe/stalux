import { createClientLogger } from "./logger";

const logger = createClientLogger("clarity");

declare global {
    interface Window {
        clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
        __staluxClarityLoaded?: boolean;
        __staluxClarityPageLoadListener?: boolean;
    }
}

function load() {
    const id = document.body?.dataset.staluxClarityId;
    if (!id || window.__staluxClarityLoaded || document.getElementById("stalux-clarity-script"))
        return;
    window.__staluxClarityLoaded = true;
    window.clarity =
        window.clarity ||
        Object.assign((...args: unknown[]) => window.clarity?.q?.push(args), { q: [] });
    const script = document.createElement("script");
    script.id = "stalux-clarity-script";
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(id)}`;
    script.addEventListener("load", () => logger.debug("external script loaded"), { once: true });
    script.addEventListener(
        "error",
        () => logger.warn("external script failed to load (network or content blocker)"),
        { once: true },
    );
    logger.debug("loading external script");
    document.head.appendChild(script);
}

if (!window.__staluxClarityPageLoadListener) {
    window.__staluxClarityPageLoadListener = true;
    document.addEventListener("astro:page-load", load);
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", load, { once: true });
else load();
