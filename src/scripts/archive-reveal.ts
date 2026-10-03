/** Enhance visible static months; never hide or collapse archive content. */
export function mountArchiveReveal() {
    const months = [...document.querySelectorAll<HTMLElement>("[data-archive-month]")];
    if (
        !months.length ||
        typeof IntersectionObserver === "undefined" ||
        typeof months[0]?.animate !== "function"
    )
        return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const print = window.matchMedia("print");
    const visible = new Set<HTMLElement>();
    const played = new Set<HTMLElement>();
    const animations = new Map<Animation, () => void>();
    let disposed = false;

    const cancelAnimations = () => {
        for (const [animation, finish] of animations) {
            animation.removeEventListener("finish", finish);
            animation.cancel();
        }
        animations.clear();
    };
    const reveal = () => {
        if (disposed || document.hidden) return;
        for (const month of visible) {
            if (played.has(month)) continue;
            played.add(month);
            observer.unobserve(month);
            if (motion.matches || print.matches) continue;
            const animation = month.animate(
                [
                    { opacity: 0, transform: "translateY(8px)" },
                    { opacity: 1, transform: "translateY(0)" },
                ],
                { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
            );
            const finish = () => {
                animation.removeEventListener("finish", finish);
                animations.delete(animation);
                animation.cancel();
            };
            animations.set(animation, finish);
            animation.addEventListener("finish", finish);
        }
    };
    const observer = new IntersectionObserver((entries) => {
        if (disposed) return;
        for (const entry of entries) {
            const month = entry.target as HTMLElement;
            if (entry.isIntersecting) visible.add(month);
            else visible.delete(month);
        }
        reveal();
    });
    const update = () => {
        if (document.hidden || motion.matches || print.matches) cancelAnimations();
        reveal();
    };
    for (const month of months) observer.observe(month);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("beforeprint", cancelAnimations);
    motion.addEventListener("change", update);
    print.addEventListener("change", update);
    return () => {
        disposed = true;
        observer.disconnect();
        cancelAnimations();
        visible.clear();
        document.removeEventListener("visibilitychange", update);
        window.removeEventListener("beforeprint", cancelAnimations);
        motion.removeEventListener("change", update);
        print.removeEventListener("change", update);
    };
}
