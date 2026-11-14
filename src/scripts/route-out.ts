import type { RouteMotionPreset } from "../utils/route-motion-policy";
import {
    EXIT_EASING,
    getRouteRegion,
    getRouteStage,
    getStageExit,
    isOversizedStage,
    offsetTransform,
} from "./route-motion";

/** Exit cues started in one synchronous block, released together. */
export interface StageExitCue {
    animations: Animation[];
    /** Drops the fill effects; call it when the entry cue takes over. */
    release: () => void;
}

/**
 * Build the outgoing half of a route gesture on a specific node.
 *
 * The caller decides the target, because the router fades the pinned *container*
 * while the shared helper animates the content *stage*: both halves must express
 * the same direction, and only the stage is available on the non-parallel path.
 *
 * Returns `null` when the reader must not see motion (reduced motion, hidden
 * tab, aborted visit) so the caller can fall back to an instant swap.
 */
export function playStageExit(
    preset: RouteMotionPreset,
    signal: AbortSignal,
    target: HTMLElement | null | undefined,
): StageExitCue | null {
    const spec = getStageExit(preset);
    if (
        !(spec && target) ||
        signal.aborted ||
        document.hidden ||
        typeof target.animate !== "function" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
        return null;

    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const distance = mobile ? Math.round(spec.distance * 0.6) : spec.distance;
    // The same compositor budget as the entry: a column taller than two
    // viewports cross-fades in place, and the lead region carries the offset.
    const oversized = distance !== 0 && isOversizedStage(target);
    const stageDistance = oversized ? 0 : distance;
    const duration = Math.max(0, mobile ? Math.round(spec.duration * 0.85) : spec.duration);
    // Article-to-article has no distance: the column fades out in place, matching
    // the entry fade, so the shell stays put and only the content disappears.
    const frames: PropertyIndexedKeyframes = { opacity: [1, 0] };
    if (stageDistance !== 0)
        frames.transform = ["translate3d(0, 0, 0)", offsetTransform(stageDistance, spec.axis)];

    const animations: Animation[] = [];
    const release = () => {
        signal.removeEventListener("abort", release);
        for (const effect of animations.splice(0)) {
            try {
                // Drop the fill so the authored styles return; a cancelled effect
                // must never leave the old document half transparent.
                effect.cancel();
            } catch {
                /* An already detached effect cannot be released further. */
            }
        }
    };
    try {
        animations.push(
            target.animate(frames, {
                duration,
                // Strong ease-in: the outgoing document accelerates away. An exit
                // is the one place ease-in is correct; entrances use ease-out.
                easing: EXIT_EASING,
                fill: "forwards",
            }),
        );
        if (oversized) {
            const region = getRouteRegion();
            if (region)
                animations.push(
                    region.animate(
                        {
                            transform: [
                                "translate3d(0, 0, 0)",
                                offsetTransform(distance, spec.axis),
                            ],
                        },
                        { duration, easing: EXIT_EASING, fill: "forwards" },
                    ),
                );
        }
    } catch {
        release();
        return null;
    }
    signal.addEventListener("abort", release, { once: true });
    return { animations, release };
}

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
    const cue = playStageExit(preset, signal, getRouteStage());
    if (!cue) return () => {};
    // The stage node survives the swap on same-container visits, so this filled
    // effect is what holds the incoming document hidden until its own cue starts.
    await Promise.all(cue.animations.map((animation) => animation.finished.catch(() => {})));
    return cue.release;
}
