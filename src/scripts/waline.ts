import { init, type WalineInitOptions } from "@waline/client";

import { registerPageLifecycle } from "./page-runtime";

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
        console.error("Failed to decode Waline config:", error);
        return;
    }
    if (!isRecord(decoded) || typeof decoded.serverURL !== "string") {
        console.warn("Waline serverURL not configured");
        return;
    }

    const options = {
        ...decoded,
        el: commentElement,
        serverURL: decoded.serverURL,
        path: typeof decoded.path === "string" ? decoded.path : window.location.pathname,
    } as WalineInitOptions;
    const instance = init(options);

    return () => instance?.destroy();
});
