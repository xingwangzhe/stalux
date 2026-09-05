import { createClientLogger } from "./logger";

const logger = createClientLogger("vercount");

declare global {
    interface Window {
        __staluxVerCountLoaded?: boolean;
    }
}

function load() {
    if (document.querySelector("script[data-stalux-vercount]")) return;
    window.__staluxVerCountLoaded = true;
    const script = document.createElement("script");
    script.defer = true;
    script.dataset.staluxVercount = "true";
    script.src = "https://events.vercount.one/js";
    script.addEventListener("load", () => logger.debug("external script loaded"), { once: true });
    script.addEventListener(
        "error",
        () => logger.warn("external script failed to load (network or content blocker)"),
        { once: true },
    );
    logger.debug("loading external script");
    document.head.appendChild(script);
}

document.addEventListener("astro:page-load", load);
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", load, { once: true });
else load();
