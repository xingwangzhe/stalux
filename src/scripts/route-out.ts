import { getRouteMotionTarget } from "./route-motion";

/** Fade the old content only after destination assets are ready. */
export async function animateRouteOut(
    element: HTMLElement | null,
    signal: AbortSignal,
): Promise<() => void> {
    if (
        !element ||
        signal.aborted ||
        document.hidden ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
        return () => {};
    const target = getRouteMotionTarget(element);
    if (!target || typeof target.animate !== "function") return () => {};
    let animation: Animation | undefined;
    const cancel = () => animation?.cancel();
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    try {
        animation = target.animate(
            mobile
                ? { opacity: [1, 0.82] }
                : { opacity: [1, 0.82], transform: ["translateY(0)", "translateY(-4px)"] },
            { duration: 80, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
        );
        signal.addEventListener("abort", cancel, { once: true });
        await animation.finished;
        // Keep the bounded outgoing cue until swap; the body stays readable.
        // Swup detaches this node; no persistent shell is animated.
    } catch {
        /* Cancellation and unsupported animation must not block a visit. */
    } finally {
        if (signal.aborted) cancel();
    }
    return () => {
        signal.removeEventListener("abort", cancel);
        cancel();
    };
}
