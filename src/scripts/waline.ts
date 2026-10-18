import { createClientLogger } from "./logger";
import { registerPageLifecycle } from "./page-runtime";

const logger = createClientLogger("waline");

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

registerPageLifecycle("waline", () => {
    const container = document.querySelector<HTMLElement>("#waline-container");
    const commentElement = document.querySelector<HTMLElement>("#waline-comment");
    if (!container || !commentElement) return;

    let decoded: unknown;
    try {
        const bytes = Uint8Array.from(atob(container.dataset.walineConfig ?? ""), (character) =>
            character.charCodeAt(0),
        );
        decoded = JSON.parse(new TextDecoder().decode(bytes));
    } catch (error) {
        logger.warn(
            `config decoding failed (${error instanceof Error ? error.name : "unknown error"})`,
        );
        return;
    }
    if (!isRecord(decoded) || typeof decoded.serverURL !== "string") {
        logger.warn("serverURL not configured");
        return;
    }

    const retry = container.querySelector<HTMLButtonElement>("[data-waline-retry]");
    const feedback = container.querySelector<HTMLElement>("[data-waline-feedback]");
    let loading = false;
    let disposed = false;
    let destroy: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;

    const load = () => {
        if (disposed || loading || destroy) return;
        loading = true;
        container.setAttribute("aria-busy", "true");
        if (retry) retry.hidden = true;
        if (feedback) feedback.hidden = true;
        observer?.disconnect();
        observer = undefined;
        void import("./waline-client")
            .then(({ mountWaline }) => {
                if (disposed || !commentElement.isConnected) return;
                destroy = mountWaline(decoded, commentElement);
                logger.debug("comment widget initialized near viewport");
            })
            .catch((error) => {
                if (disposed) return;
                if (retry) retry.hidden = false;
                if (feedback) feedback.hidden = false;
                logger.warn(
                    `comment assets failed to load (${error instanceof Error ? error.name : "unknown error"})`,
                );
            })
            .finally(() => {
                loading = false;
                if (!disposed) container.removeAttribute("aria-busy");
            });
    };
    const reloadPage = () => window.location.reload();
    retry?.addEventListener("click", reloadPage);

    if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) load();
            },
            { rootMargin: `${Math.min(400, Math.round(window.innerHeight * 0.5))}px 0px` },
        );
        observer.observe(container);
    } else {
        load();
    }

    return () => {
        disposed = true;
        observer?.disconnect();
        retry?.removeEventListener("click", reloadPage);
        destroy?.();
    };
});
