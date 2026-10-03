/** Bind to the current page DOM; the shared lifecycle disposes before a body swap. */
export function mountBackToTop() {
    const button = document.querySelector<HTMLButtonElement>("[data-stalux-back-to-top]");
    if (!button) return;
    const update = () => {
        button.hidden = window.scrollY < 240;
    };
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
        });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    button.addEventListener("click", scrollToTop);
    return () => {
        window.removeEventListener("scroll", update);
        button.removeEventListener("click", scrollToTop);
    };
}
