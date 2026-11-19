/** The page shell persists across Swup visits, so the threshold needs one observer. */
export function installBackToTop(): void {
    const sentinel = document.querySelector("[data-stalux-scroll-sentinel]");
    const link = document.querySelector<HTMLAnchorElement>("[data-stalux-back-to-top]");
    if (!(sentinel && link)) return;

    new IntersectionObserver(([entry]) => {
        if (entry) link.hidden = entry.isIntersecting;
    }).observe(sentinel);
}
