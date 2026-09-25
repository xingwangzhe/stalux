import type { WalineInitOptions } from "@waline/client";
import walineCss from "@waline/client/style?inline";
import staluxWalineCss from "../styles/components/posts/waline.css?inline";
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

    void import("@waline/client")
        .then((waline) => {
            if (disposed || !commentElement.isConnected) return;
            const style = document.createElement("style");
            style.dataset.staluxWaline = "true";
            style.textContent = `${walineCss}\n${staluxWalineCss}`;
            document.head.append(style);
            const options = {
                ...decoded,
                el: commentElement,
                serverURL: decoded.serverURL,
                path: typeof decoded.path === "string" ? decoded.path : window.location.pathname,
            } as WalineInitOptions;
            const instance = waline.init(options);
            destroy = () => instance?.destroy();
            logger.debug("comment widget initialized");
        })
        .catch((error) => {
            logger.warn(
                `comment assets failed to load (${error instanceof Error ? error.name : "unknown error"})`,
            );
        });

    return () => {
        disposed = true;
        destroy?.();
    };
});
