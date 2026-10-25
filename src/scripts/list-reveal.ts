const CONTAINER = "[data-stalux-reveal]";
const ITEM = ":scope > [data-stalux-reveal-item]";
// A cascade is only ever a bounded group cue: never one observer per row, and
// never a queue long enough to keep the reader waiting for the last item.
const MAX_CONTAINERS = 48;
const MAX_ITEMS = 16;
const STAGGER_MS = 22;
const MAX_DELAY_MS = 176;
const DURATION_MS = 240;

/**
 * Lists cascade in once, when their group becomes visible.
 *
 * Text is authored fully visible; the effect only dims a group that is about to
 * be read. Rows outside the group cap, restored history entries, reduced
 * motion, persisted shells and hidden documents are left untouched.
 */
export function mountListReveal(): (() => void) | undefined {
    if (typeof IntersectionObserver !== "function") return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || document.hidden) return;
    // Returning to a history entry restores what the reader already saw.
    if (document.documentElement.dataset.staluxVtPreset === "restore") return;
    const containers = [...document.querySelectorAll<HTMLElement>(CONTAINER)]
        .filter((element) => !element.closest("[data-swup-persist]"))
        .slice(0, MAX_CONTAINERS);
    if (!containers.length) return;

    const active = new Set<Animation>();
    const cancel = () => {
        for (const animation of active) animation.cancel();
        active.clear();
    };
    const reveal = (container: HTMLElement) => {
        if (document.hidden || preference.matches) return;
        const items = [...container.querySelectorAll<HTMLElement>(ITEM)].slice(0, MAX_ITEMS);
        for (const [index, item] of items.entries()) {
            if (typeof item.animate !== "function") continue;
            try {
                const animation = item.animate(
                    {
                        opacity: [0.6, 1],
                        transform: ["translateY(8px)", "translateY(0)"],
                    },
                    {
                        duration: DURATION_MS,
                        delay: Math.min(index * STAGGER_MS, MAX_DELAY_MS),
                        easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
                        // Dimmed during the stagger delay instead of popping in.
                        fill: "backwards",
                    },
                );
                active.add(animation);
                const release = () => {
                    active.delete(animation);
                    animation.cancel();
                };
                void animation.finished.then(release, release);
            } catch {
                /* An unsupported effect leaves the authored visible list. */
            }
        }
    };
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                observer.unobserve(entry.target);
                reveal(entry.target as HTMLElement);
            }
        },
        { threshold: 0.05 },
    );
    for (const container of containers) observer.observe(container);
    preference.addEventListener("change", cancel);
    return () => {
        observer.disconnect();
        preference.removeEventListener("change", cancel);
        cancel();
    };
}
