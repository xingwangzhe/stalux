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
    let animation: Animation | undefined;
    const cancel = () => animation?.cancel();
    try {
        animation = element.animate(
            { opacity: [1, 0], transform: ["translateY(0)", "translateY(-8px)"] },
            { duration: 140, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
        );
        signal.addEventListener("abort", cancel, { once: true });
        await animation.finished;
        // Keep the old page hidden until swap, but release effects on abort.
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
