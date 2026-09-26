import { afterLoadAndIdle } from "./after-load";
import { createClientLogger } from "./logger";

const logger = createClientLogger("umami");

const id = document.body?.dataset.staluxUmamiId;
const url = document.body?.dataset.staluxUmamiUrl;

if (id && url) {
    afterLoadAndIdle(() => {
        if (document.querySelector("script[data-stalux-umami]")) return;
        const script = document.createElement("script");
        script.async = true;
        script.dataset.staluxUmami = "true";
        script.dataset.websiteId = id;
        script.src = url;
        script.addEventListener("load", () => logger.debug("external script loaded"), {
            once: true,
        });
        script.addEventListener(
            "error",
            () => logger.warn("external script failed to load (network or content blocker)"),
            { once: true },
        );
        logger.debug("loading external script after page load and idle time");
        document.head.appendChild(script);
    });
}
