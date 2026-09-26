type IdleWindow = Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

/** Run non-essential work after the initial page load and during an idle period. */
export function afterLoadAndIdle(callback: () => void): void {
    let scheduled = false;
    const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        const idleWindow = window as IdleWindow;
        if (idleWindow.requestIdleCallback) {
            idleWindow.requestIdleCallback(callback, { timeout: 2_000 });
        } else {
            window.setTimeout(callback, 0);
        }
    };

    if (document.readyState === "complete") {
        schedule();
        return;
    }

    window.addEventListener("load", schedule, { once: true });
    // Still load analytics if a third-party resource prevents the load event.
    window.setTimeout(schedule, 5_000);
}
