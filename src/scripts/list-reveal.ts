const CONTAINER = "[data-stalux-reveal]";
const ITEM = ":scope > [data-stalux-reveal-item]";
// A cascade is only ever a bounded group cue: never one observer per row, and
// never a queue long enough to keep the reader waiting for the last item.
const MAX_CONTAINERS = 48;
const MAX_ITEMS = 16;
const STAGGER_MS = 45;
const MAX_DELAY_MS = 400;
const DURATION_MS = 380;
// When a route cue is already moving the page body, the sheet waits for it to
// mostly settle before unrolling. Starting both at once makes the rows wipe
// open while the whole page is still semi-transparent, which reads as a smudge.
const ROUTE_LEAD_IN_MS = 150;
// Strong ease-out: the row arrives fast and settles softly. The built-in
// ease-out is too weak to read at this size.
const EASING = "cubic-bezier(0.23, 1, 0.32, 1)";
// The clip is inset by a negative margin so a card's box-shadow is not sheared
// off by the wipe. A hard `inset(0)` would clip the shadow to the border box and
// make it pop back in when the effect is released.
const BLEED = "-10px";
const UNROLL_START = `inset(${BLEED} ${BLEED} 100% ${BLEED})`;
const UNROLL_END = `inset(${BLEED} ${BLEED} ${BLEED} ${BLEED})`;

/**
 * Rows unroll into place like paper: each one wipes open from its top edge
 * downward while settling a few pixels, and the next row starts before the
 * previous one finishes so the group reads as one continuous sheet unrolling.
 *
 * Text is authored fully visible. The effect only ever runs on a group that is
 * about to be read, is skipped for restored history, reduced motion, hidden
 * documents and persisted shells, and every clip is released afterwards so no
 * clipped state can outlive the animation.
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
    // A route cue leaves its preset on the document element while it runs.
    const leadIn = document.documentElement.dataset.staluxVtPreset ? ROUTE_LEAD_IN_MS : 0;

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
                    [
                        {
                            clipPath: UNROLL_START,
                            opacity: 0.4,
                            transform: "translate3d(0, -10px, 0)",
                        },
                        {
                            clipPath: UNROLL_END,
                            opacity: 1,
                            transform: "translate3d(0, 0, 0)",
                        },
                    ],
                    {
                        duration: DURATION_MS,
                        delay: leadIn + Math.min(index * STAGGER_MS, MAX_DELAY_MS),
                        easing: EASING,
                        // Hidden during the stagger delay instead of popping in.
                        fill: "backwards",
                    },
                );
                active.add(animation);
                const release = () => {
                    active.delete(animation);
                    // Drops the clip so nothing stays cut off after the wipe.
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
