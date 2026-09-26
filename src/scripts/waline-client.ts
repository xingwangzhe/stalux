import { init, type WalineInitOptions } from "@waline/client";
import walineCss from "@waline/client/style?inline";
import staluxWalineCss from "../styles/components/posts/waline.css?inline";

export function mountWaline(config: Record<string, unknown>, element: HTMLElement): () => void {
    const style = document.createElement("style");
    style.dataset.staluxWaline = "true";
    style.textContent = `${walineCss}\n${staluxWalineCss}`;
    document.head.append(style);

    const options = {
        ...config,
        el: element,
        serverURL: config.serverURL,
        path: typeof config.path === "string" ? config.path : window.location.pathname,
    } as WalineInitOptions;
    const instance = init(options);

    return () => {
        instance?.destroy();
        style.remove();
    };
}
