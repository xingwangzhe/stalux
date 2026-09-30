/** Run a wall-clock update only while its element and document are visible. */
export function observeVisibleClock(element: Element, update: () => void): () => void {
    const controller = new AbortController();
    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
        if (timer !== undefined) clearInterval(timer);
        timer = undefined;
        if (!visible || document.hidden) return;
        update();
        timer = setInterval(update, 1_000);
    };
    const observer = new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        sync();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync, { signal: controller.signal });
    return () => {
        controller.abort();
        observer.disconnect();
        if (timer !== undefined) clearInterval(timer);
    };
}
