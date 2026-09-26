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

    let disposed = false;
    let destroy: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;

    const load = () => {
        observer?.disconnect();
        observer = undefined;
        void import("./waline-client")
            .then(({ mountWaline }) => {
                if (disposed || !commentElement.isConnected) return;
                destroy = mountWaline(decoded, commentElement);
                logger.debug("comment widget initialized near viewport");
            })
            .catch((error) => {
                logger.warn(
                    `comment assets failed to load (${error instanceof Error ? error.name : "unknown error"})`,
                );
            });
    };

    if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) load();
            },
            { rootMargin: "1000px 0px" },
        );
        observer.observe(container);
    } else {
        load();
    }

    return () => {
        disposed = true;
        observer?.disconnect();
        destroy?.();
    };
});
