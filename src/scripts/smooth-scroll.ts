let stopActive: (() => void) | undefined;

export function cancelPageScroll(): void {
    stopActive?.();
}

export interface PageGlide {
    /** Settles when the page reaches the top, is interrupted, or is canceled. */
    promise: Promise<void>;
    /** Stop immediately at the current position without further frames. */
    cancel: () => void;
}

/** Bound the pre-swap return-to-top so a 6000px article does not add a second. */
const GLIDE_MIN_MS = 80;
const GLIDE_MAX_MS = 180;
const GLIDE_SAFETY_MS = 380;

/**
 * Walk the current document back to the top before the container is replaced.
 * Swup's own between-page reset is instant; animating it after the swap would
 * make the new article start wherever the old page happened to be scrolled.
 * Doing it on the outgoing document keeps the incoming page at its real top.
 */
export function glideToTop(): PageGlide {
    const element = document.scrollingElement ?? document.documentElement;
    const startTop = Math.max(0, element.scrollTop || window.scrollY || 0);
    const startLeft = Math.max(0, element.scrollLeft || window.scrollX || 0);
    let resolve = () => {};
    const promise = new Promise<void>((done) => {
        resolve = done;
    });
    if (
        startTop < 1 ||
        typeof requestAnimationFrame !== "function" ||
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
        document.hidden
    ) {
        resolve();
        return { promise, cancel: resolve };
    }

    // Longer documents take proportionally longer, but the ceiling keeps the
    // whole cue inside the same budget as the content fade.
    const duration = Math.min(GLIDE_MAX_MS, GLIDE_MIN_MS + startTop / 20);
    let frame: number | undefined;
    let settled = false;
    const release = () => {
        window.removeEventListener("wheel", finish);
        window.removeEventListener("touchstart", finish);
        window.removeEventListener("keydown", finish);
        clearTimeout(safety);
        if (stopActive === finish) stopActive = undefined;
    };
    const finish = () => {
        if (settled) return;
        settled = true;
        if (frame !== undefined) cancelAnimationFrame(frame);
        release();
        resolve();
    };
    // A wheel/touch/key press means the reader reclaimed the scroll; stop at
    // the frame already rendered instead of fighting the gesture.
    const safety = setTimeout(finish, GLIDE_SAFETY_MS);
    stopActive = finish;
    window.addEventListener("wheel", finish, { passive: true, once: true });
    window.addEventListener("touchstart", finish, { passive: true, once: true });
    window.addEventListener("keydown", finish, { once: true });

    const begin = performance.now();
    let frames = 0;
    const step = (now: number) => {
        if (settled) return;
        // Frame ceiling: a host that invokes rAF synchronously must not turn
        // this loop into unbounded recursion. Real browsers reach the safety
        // timeout first; twenty frames cover the 320ms budget at 60Hz.
        if (++frames > 240) {
            finish();
            return;
        }
        const progress = Math.min(1, Math.max(0, (now - begin) / duration));
        // Quadratic ease-out: reads as a scroll rather than a snap, and still
        // spends most of its time near the top where the article begins.
        const remaining = (1 - progress) ** 2;
        element.scrollTop = Math.round(startTop * remaining);
        element.scrollLeft = Math.round(startLeft * remaining);
        if (progress < 1) frame = requestAnimationFrame(step);
        else finish();
    };
    frame = requestAnimationFrame(step);
    return { promise, cancel: finish };
}

/** Native scrolling with bounded completion and explicit listener cleanup. */
export function scrollPage(
    element: Element,
    top: number,
    left: number,
    animate: boolean,
    start: () => void,
    end: () => void,
): void {
    stopActive?.();
    start();
    const smooth = animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (
        !smooth ||
        (Math.abs(element.scrollTop - top) < 1 && Math.abs(element.scrollLeft - left) < 1)
    ) {
        element.scrollTo({ top, left, behavior: "instant" });
        end();
        return;
    }
    const target =
        element === document.documentElement || element === document.body ? window : element;
    let finished = false;
    const done = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        target.removeEventListener("scrollend", done);
        window.removeEventListener("wheel", interrupt);
        window.removeEventListener("touchstart", interrupt);
        window.removeEventListener("keydown", interrupt);
        if (stopActive === interrupt) stopActive = undefined;
        end();
    };
    const interrupt = () => {
        element.scrollTo({ top: element.scrollTop, left: element.scrollLeft, behavior: "instant" });
        done();
    };
    const timer = setTimeout(done, 1500);
    stopActive = interrupt;
    target.addEventListener("scrollend", done, { once: true });
    window.addEventListener("wheel", interrupt, { passive: true, once: true });
    window.addEventListener("touchstart", interrupt, { passive: true, once: true });
    window.addEventListener("keydown", interrupt, { once: true });
    element.scrollTo({ top, left, behavior: "smooth" });
}
