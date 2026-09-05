import { init, type WalineInitOptions } from "@waline/client";
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

    const options = {
        ...decoded,
        el: commentElement,
        serverURL: decoded.serverURL,
        path: typeof decoded.path === "string" ? decoded.path : window.location.pathname,
    } as WalineInitOptions;
    const instance = init(options);
    logger.debug("comment widget initialized");

    return () => instance?.destroy();
});
