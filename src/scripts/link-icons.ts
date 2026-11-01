/**
 * Link-page icons come from arbitrary third-party hosts. Native lazy loading
 * still fetches everything within the browser's large lazy threshold (up to
 * 3000px), and a single link list therefore pulled several megabytes of
 * avatars that the reader never reached. Load only icons near the viewport.
 */
import { createClientLogger } from "./logger";
import { registerPageLifecycle } from "./page-runtime";

const logger = createClientLogger("link-icons");

function reveal(image: HTMLImageElement): void {
    const source = image.dataset.src;
    if (!source) return;
    delete image.dataset.src;
    image.addEventListener(
        "error",
        () => {
            // Keep the reserved box; the stylesheet draws a neutral disc instead.
            image.removeAttribute("src");
            image.dataset.staluxLinkIconFailed = "true";
            logger.debug("link icon failed to load; placeholder retained");
        },
        { once: true },
    );
    image.src = source;
}

export function mountLinkIcons(): (() => void) | undefined {
    const images = Array.from(
        document.querySelectorAll<HTMLImageElement>("img[data-stalux-link-icon]"),
    );
    if (!images.length) return;

    if (!("IntersectionObserver" in window)) {
        for (const image of images) reveal(image);
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                observer.unobserve(entry.target);
                reveal(entry.target as HTMLImageElement);
            }
        },
        { rootMargin: "400px 0px" },
    );
    for (const image of images) observer.observe(image);
    return () => observer.disconnect();
}

registerPageLifecycle("link-icons", mountLinkIcons);
