const CONTAINER = "[data-stalux-reveal]";
const ITEM = ":scope > [data-stalux-reveal-item]";
const MAX_CONTAINERS = 48;
const MAX_ITEMS = 16;

export function mountListReveal(): (() => void) | undefined {
    const html = document.documentElement;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (document.hidden || preference.matches || html.dataset.staluxVtPreset === "restore") return;
    const containers = [...document.querySelectorAll(CONTAINER)]
        .filter(
            (element) =>
                element.hasAttribute("data-stalux-shell-fresh") ||
                !element.closest("[data-swup-persist]"),
        )
        .slice(0, MAX_CONTAINERS);
    if (!containers.length) return;

    const animated = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
        (entries) => {
            for (const { isIntersecting, target } of entries) {
                if (!isIntersecting) continue;
                observer.unobserve(target);
                // The route cue owns rows already visible at the swap. Rows below
                // the fold still unroll once when the reader scrolls to them.
                if (document.hidden || preference.matches || html.dataset.staluxVtPreset) continue;
                for (const [index, row] of [...target.querySelectorAll<HTMLElement>(ITEM)]
                    .slice(0, MAX_ITEMS)
                    .entries()) {
                    row.style.setProperty(
                        "--stalux-reveal-delay",
                        `${Math.min(index * 22, 200)}ms`,
                    );
                    row.setAttribute("data-stalux-revealing", "");
                    animated.add(row);
                }
            }
        },
        { threshold: 0.05 },
    );
    for (const container of containers) observer.observe(container);

    return () => {
        observer.disconnect();
        for (const row of animated) {
            row.removeAttribute("data-stalux-revealing");
            row.style.removeProperty("--stalux-reveal-delay");
        }
    };
}
