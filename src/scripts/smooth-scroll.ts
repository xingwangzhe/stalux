let stopActive: (() => void) | undefined;

export function cancelPageScroll(): void {
    stopActive?.();
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
