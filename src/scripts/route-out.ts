import type { RouteMotionPreset } from "../utils/route-motion-policy";
import { getRouteStage, getStageExit } from "./route-motion";

/**
 * Fade and shift the current content stage out, continuing the entry direction
 * so the two halves read as one movement instead of a flash.
 *
 * The returned release keeps the fill effect until the entry cue takes over.
 * Cancelling here would expose the freshly swapped document at full opacity for
 * a frame before it animates in — the exact flash this replaces.
 */
export async function animateRouteOut(
    preset: RouteMotionPreset,
    signal: AbortSignal,
): Promise<() => void> {
    const spec = getStageExit(preset);
    const stage = spec ? getRouteStage() : null;
    if (
        !spec ||
        !stage ||
        signal.aborted ||
        document.hidden ||
        typeof stage.animate !== "function" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
        return () => {};
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const distance = mobile ? Math.round(spec.distance * 0.6) : spec.distance;
    const to =
        spec.axis === "x" ? `translate3d(${distance}px, 0, 0)` : `translate3d(0, ${distance}px, 0)`;
    // Article-to-article has no distance: the column fades out in place, matching
    // the entry fade, so the shell stays put and only the content disappears.
    const keyframes: PropertyIndexedKeyframes = { opacity: [1, 0] };
    if (distance !== 0) keyframes.transform = ["translate3d(0, 0, 0)", to];
    let animation: Animation | undefined;
    const cancel = () => {
        const active = animation;
        animation = undefined;
        try {
            active?.cancel();
        } catch {
            /* An already detached effect cannot be released further. */
        }
    };
    try {
        animation = stage.animate(keyframes, {
            duration: mobile ? Math.round(spec.duration * 0.62) : Math.round(spec.duration * 0.58),
            // Strong ease-in: the outgoing document accelerates away. An exit
            // is the one place ease-in is correct; entrances use ease-out.
            easing: "cubic-bezier(0.4, 0, 1, 1)",
            fill: "forwards",
        });
        signal.addEventListener("abort", cancel, { once: true });
        await animation.finished;
        // The stage node survives the swap, so this filled effect is what holds
        // the incoming document hidden until its own cue starts.
    } catch {
        /* Cancellation and unsupported animation must not block a visit. */
    }
    return () => {
        signal.removeEventListener("abort", cancel);
        cancel();
    };
}
