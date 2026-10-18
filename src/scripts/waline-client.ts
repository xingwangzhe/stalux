import { init, type WalineInitOptions } from "@waline/client";
import walineCss from "@waline/client/style?inline";
import staluxWalineCss from "../styles/generated-waline.css?inline";

export function mountWaline(config: Record<string, unknown>, element: HTMLElement): () => void {
    const style = document.createElement("style");
    style.dataset.staluxWaline = "true";
    style.textContent = `${walineCss}\n${staluxWalineCss}`;
    document.head.append(style);

    const options = {
        ...config,
        el: element,
        serverURL: config.serverURL,
        path:
            typeof config.path === "string" && config.path.trim()
                ? config.path
                : window.location.pathname,
    } as WalineInitOptions;
    try {
        const instance = init(options);
        if (!instance || instance.el !== element) throw new Error("Waline mount failed");
        return () => {
            try {
                instance.destroy();
            } finally {
                style.remove();
            }
        };
    } catch (error) {
        style.remove();
        throw error;
    }
}
