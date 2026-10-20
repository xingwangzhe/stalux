interface BackToTopWindow extends Window {
    __STALUX_BACK_TO_TOP__?: boolean;
}

const SENTINEL_SELECTOR = "[data-stalux-scroll-sentinel]";
const BUTTON_SELECTOR = "[data-stalux-back-to-top]";

/**
 * Install once per document. The footer button and the scroll sentinel both
 * persist across Astro soft navigations, so a single observer keeps working
 * without a per-page remount. The old implementation read `window.scrollY`
 * synchronously during `astro:page-load`, which forced a full style/layout
 * flush while the swapped DOM was still dirty and the native transition had
 * not reached `ready`.
 */
export function installBackToTop(): void {
    const host = window as BackToTopWindow;
    if (host.__STALUX_BACK_TO_TOP__) return;
    const sentinel = document.querySelector(SENTINEL_SELECTOR);
    const button = document.querySelector<HTMLButtonElement>(BUTTON_SELECTOR);
    if (!sentinel || !button) return;
    host.__STALUX_BACK_TO_TOP__ = true;

    button.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
        });
    });

    // IntersectionObserver computes the answer off the main thread, so the
    // button state never blocks the route swap with a synchronous layout read.
    new IntersectionObserver((entries) => {
        for (const entry of entries) button.hidden = entry.isIntersecting;
    }).observe(sentinel);
}
