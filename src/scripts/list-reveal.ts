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
const UNROLL_KEYFRAMES: Keyframe[] = [
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
];
// A swap can leave a row waiting at the start frame until it is scrolled into
// view. Keep the bookkeeping bounded; a runaway map would pin removed nodes.
const MAX_HELD = MAX_CONTAINERS * MAX_ITEMS;
// A held row that never reaches the viewport would sit clipped forever if the
// visit were abandoned before the observer ever ran. Releasing it after this
// long is safe: an unheld row falls back to the original path, which starts the
// wipe on its own without a flash.
const HOLD_TIMEOUT_MS = 5000;

interface Held {
    animation: Animation;
    stagger: number;
    timer: ReturnType<typeof setTimeout>;
}
const held = new Map<HTMLElement, Held>();

function canReveal(): boolean {
    if (typeof IntersectionObserver !== "function") return false;
    if (typeof document === "undefined") return false;
    if (document.hidden) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    // Returning to a history entry restores what the reader already saw.
    return document.documentElement.dataset.staluxVtPreset !== "restore";
}

function groups(): HTMLElement[] {
    return [...document.querySelectorAll<HTMLElement>(CONTAINER)]
        .filter((element) => !element.closest("[data-swup-persist]"))
        .slice(0, MAX_CONTAINERS);
}

function rows(group: HTMLElement): HTMLElement[] {
    return [...group.querySelectorAll<HTMLElement>(ITEM)].slice(0, MAX_ITEMS);
}

/**
 * Only a group the reader can already see is worth holding.
 *
 * Every held row costs a live effect on the compositor. An archive page carries
 * one group per month, so holding all of them at swap time built hundreds of
 * paused effects inside the swap frame — a 200-400ms task that dropped the frame
 * the entry cue needed. Groups further down the page keep the authored visible
 * state and start their wipe when they scroll in, which never flashed anyway.
 */
function nearViewport(group: HTMLElement): boolean {
    const rect = group.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const margin = window.innerHeight * 0.5;
    return rect.top < window.innerHeight + margin && rect.bottom > -margin;
}

function staggerOf(index: number): number {
    return Math.min(index * STAGGER_MS, MAX_DELAY_MS);
}

function leadIn(): number {
    // A route cue leaves its preset on the document element while it runs.
    return document.documentElement.dataset.staluxVtPreset ? ROUTE_LEAD_IN_MS : 0;
}

/**
 * Hold every incoming row on the wipe's first frame the moment the router has
 * its new document, before the browser paints it.
 *
 * Without this the swap paints the finished list for one frame, the observer
 * fires a frame later, and the rows appear to flash, vanish, then unroll. A
 * paused effect still paints its `backwards` fill, so priming here makes the
 * first painted frame the *start* of the wipe: the reader only ever sees the
 * sheet hidden, then unrolling.
 */
export function primeListReveal(): void {
    if (!canReveal()) return;
    // Rows from the document that was just replaced can never be revealed
    // again; drop their paused effects instead of pinning detached nodes.
    for (const [row, entry] of held) {
        if (row.isConnected) continue;
        held.delete(row);
        clearTimeout(entry.timer);
        entry.animation.cancel();
    }
    for (const group of groups()) {
        // A group that is not laid out (the desktop tag cloud hides the mobile
        // card groups, and vice versa) could never play its effect, and a group
        // that is still off-screen must not add effects to the swap frame.
        if (!nearViewport(group)) continue;
        for (const [index, row] of rows(group).entries()) {
            if (held.has(row) || held.size >= MAX_HELD) continue;
            if (typeof row.animate !== "function") continue;
            try {
                const animation = row.animate(UNROLL_KEYFRAMES, {
                    duration: DURATION_MS,
                    delay: 0,
                    easing: EASING,
                    // The paused effect still paints this first frame, which is
                    // what removes the flash.
                    fill: "backwards",
                });
                animation.pause();
                const timer = setTimeout(() => {
                    // The visit was abandoned: release the row so the authored
                    // visible state returns rather than staying clipped.
                    if (!held.has(row)) return;
                    held.delete(row);
                    animation.cancel();
                }, HOLD_TIMEOUT_MS);
                held.set(row, { animation, stagger: staggerOf(index), timer });
            } catch {
                /* An unsupported effect leaves the authored visible row. */
            }
        }
    }
}

function cancelHeld(): void {
    for (const [row, entry] of held) {
        held.delete(row);
        clearTimeout(entry.timer);
        entry.animation.cancel();
    }
}

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
    if (!canReveal()) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const containers = groups();
    if (!containers.length) return;

    const active = new Set<Animation>();
    // Disposal runs on every same-document remount (page-runtime remounts on
    // page-load). Releasing the held rows there would paint the finished list
    // for a frame and clip it again on the next mount, which is the very flash
    // this file removes. Held rows are released by the observer, by the timeout
    // or by a reduced-motion switch instead.
    const cancelActive = () => {
        for (const animation of active) animation.cancel();
        active.clear();
    };
    const reveal = (container: HTMLElement) => {
        if (document.hidden || preference.matches) return;
        const lead = leadIn();
        for (const [index, row] of rows(container).entries()) {
            if (typeof row.animate !== "function") continue;
            // Prefer the effect created during the swap: it already owns the
            // start frame, so starting it here never shows a finished row.
            const primed = held.get(row);
            if (primed) {
                held.delete(row);
                clearTimeout(primed.timer);
            }
            try {
                const animation =
                    primed?.animation ??
                    row.animate(UNROLL_KEYFRAMES, {
                        duration: DURATION_MS,
                        delay: lead + staggerOf(index),
                        easing: EASING,
                        // Hidden during the stagger delay instead of popping in.
                        fill: "backwards",
                    });
                if (primed) {
                    // The stagger is counted from now, not from the swap.
                    primed.animation.effect?.updateTiming({
                        delay: lead + primed.stagger,
                    });
                    primed.animation.play();
                }
                active.add(animation);
                const release = () => {
                    active.delete(animation);
                    // Drops the clip so nothing stays cut off after the wipe.
                    animation.cancel();
                };
                void animation.finished.then(release, release);
            } catch {
                // A paused row would stay clipped forever otherwise.
                primed?.animation.cancel();
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
    const stopMotion = () => {
        cancelActive();
        // The reader asked for less motion: nothing may stay clipped.
        cancelHeld();
    };
    preference.addEventListener("change", stopMotion);
    return () => {
        observer.disconnect();
        preference.removeEventListener("change", stopMotion);
        cancelActive();
    };
}

// The router dispatches this synchronously after replacing the main node and
// before the browser paints, which is the only moment where the incoming rows
// can be held without a visible flash. Registered once per document even when
// both the shared layout and the article layout import this module.
interface PrimeHost {
    __staluxListRevealPrime?: boolean;
}
if (typeof document !== "undefined" && typeof window !== "undefined") {
    const host = document as Document & PrimeHost;
    if (!host.__staluxListRevealPrime) {
        host.__staluxListRevealPrime = true;
        document.addEventListener("astro:after-swap", primeListReveal);
    }
}
