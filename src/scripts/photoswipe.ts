import { createClientLogger } from "./logger";

import { registerPageLifecycle } from "./page-runtime";
import { createRetryableInitializer } from "./retryable-initializer";

const logger = createClientLogger("photoswipe");

const GALLERY_SELECTOR = "a.pswp-gallery-item";

async function enrichPhotoSwipeData(container: Element, signal: AbortSignal): Promise<void> {
    const links = container.querySelectorAll<HTMLAnchorElement>(GALLERY_SELECTOR);
    for (const link of links) {
        if (signal.aborted) return;
        const image = link.querySelector<HTMLImageElement>("img");
        if (!image) continue;

        if (image.naturalWidth && image.naturalHeight) {
            link.dataset.pswpWidth = String(image.naturalWidth);
            link.dataset.pswpHeight = String(image.naturalHeight);
            continue;
        }

        const temporaryImage = new Image();
        temporaryImage.src = image.currentSrc || image.src;
        const cancel = () => temporaryImage.removeAttribute("src");
        signal.addEventListener("abort", cancel, { once: true });
        try {
            await temporaryImage.decode();
        } catch {
            if (signal.aborted) return;
            logger.debug("image dimensions unavailable; skipping enrichment");
            continue;
        } finally {
            signal.removeEventListener("abort", cancel);
        }
        if (signal.aborted) return;
        link.dataset.pswpWidth = String(temporaryImage.naturalWidth);
        link.dataset.pswpHeight = String(temporaryImage.naturalHeight);
    }
}

registerPageLifecycle("photoswipe", () => {
    const container = document.querySelector<HTMLElement>(
        "[data-stalux-gallery='true'] [data-pagefind-body]",
    );
    if (!container) return;

    const controller = new AbortController();
    let lightbox: import("photoswipe/lightbox").default | undefined;
    let initialized = false;
    let disposed = false;

    const initialize = async () => {
        logger.debug("loading lightbox modules");
        const [{ default: PhotoSwipeLightbox }, { default: PhotoSwipe }] = await Promise.all([
            import("photoswipe/lightbox"),
            import("photoswipe"),
        ]);
        if (disposed) return;
        void enrichPhotoSwipeData(container, controller.signal);
        lightbox = new PhotoSwipeLightbox({
            gallery: container,
            children: GALLERY_SELECTOR,
            pswpModule: PhotoSwipe,
            initialZoomLevel: "fill",
        });
        lightbox.on("openingAnimationEnd", () => logger.debug("opening animation completed"));
        lightbox.on("close", () => logger.debug("lightbox closing"));
        lightbox.on("destroy", () => logger.debug("lightbox destroyed"));
        lightbox.init();
        logger.debug("lightbox initialized");
    };

    const ensureInitialized = createRetryableInitializer(initialize);
    const handleClick = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const anchor = target.closest<HTMLAnchorElement>(GALLERY_SELECTOR);
        if (!anchor || initialized) return;

        event.preventDefault();
        const links = [...container.querySelectorAll(GALLERY_SELECTOR)];
        const clickedIndex = links.indexOf(anchor);
        const initialPoint = { x: event.clientX, y: event.clientY };

        void ensureInitialized()
            .then(() => {
                if (disposed) return;
                initialized = true;
                logger.debug(`opening image index=${clickedIndex}`);
                lightbox?.loadAndOpen(clickedIndex, undefined, initialPoint);
            })
            .catch((error: unknown) => {
                logger.error("initialization failed; next click can retry", error);
            });
    };

    document.addEventListener("click", handleClick, {
        capture: true,
        signal: controller.signal,
    });

    return () => {
        disposed = true;
        controller.abort();
        lightbox?.destroy();
        lightbox = undefined;
        initialized = false;
    };
});
