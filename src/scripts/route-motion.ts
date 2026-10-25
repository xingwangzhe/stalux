import type { RouteMotionPreset } from "../utils/route-motion-policy";

export interface RouteMotionEvent {
    // Retained for integrations using the shared gates with a native transition.
    // Stalux's Swup router leaves this unset and owns the animation lifecycle.
    viewTransition?: {
        ready?: PromiseLike<unknown>;
        finished?: PromiseLike<unknown>;
    };
    signal?: AbortSignal;
}

export interface RouteMotionOptions {
    skip?: boolean;
    /** Use a bounded introductory region around the marked heading. */
    content?: boolean;
    preset?: RouteMotionPreset;
    browserMotion?: boolean;
}

export interface RouteMotion {
    ready: Promise<void>;
    finished: Promise<void>;
    start: (heading: HTMLElement | null, options?: RouteMotionOptions) => void;
    cancel: () => void;
}

interface HeadingMotion {
    opacity: number;
    duration: number;
    x?: number;
    y?: number;
}

// Legacy heading cues remain available to integrations. The router requests
// one content animation; it never stacks a second animation on the heading.
const headingMotions: Record<Exclude<RouteMotionPreset, "none">, HeadingMotion> = {
    glide: { opacity: 0.86, duration: 100 },
    article: { opacity: 0.86, duration: 100 },
    enter: { opacity: 0.86, duration: 140, y: 6 },
    up: { opacity: 0.9, duration: 120, y: -4 },
    taxonomy: { opacity: 0.85, duration: 120 },
    previous: { opacity: 0.9, duration: 140, x: -8 },
    next: { opacity: 0.9, duration: 140, x: 8 },
    panel: { opacity: 0.9, duration: 120, y: 4 },
    home: { opacity: 0.9, duration: 120, y: 4 },
    restore: { opacity: 0.96, duration: 80 },
    error: { opacity: 0.9, duration: 80 },
};

const motions = new WeakMap<object, RouteMotion>();
const settle = (promise?: PromiseLike<unknown>): Promise<void> =>
    Promise.resolve(promise).then(
        () => undefined,
        () => undefined,
    );

function completion() {
    let resolve = () => {};
    const promise = new Promise<void>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

/** A route transition never captures a long article, list, or off-screen heading. */
export function getRouteMotionTarget(focus: HTMLElement | null): HTMLElement | null {
    if (!focus?.isConnected || !focus.hasAttribute("data-stalux-motion-focus")) return null;
    const visible = (element: HTMLElement, maxHeight: number) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.height <= maxHeight &&
            rect.top < window.innerHeight &&
            rect.bottom > 0 &&
            rect.left < window.innerWidth &&
            rect.right > 0
        );
    };
    if (!visible(focus, Math.min(320, window.innerHeight / 2))) return null;
    const region = focus.closest?.<HTMLElement>("[data-stalux-motion-region]");
    return region?.isConnected && visible(region, Math.min(420, window.innerHeight * 0.6))
        ? region
        : focus;
}

const regionMotions: Record<Exclude<RouteMotionPreset, "none">, HeadingMotion> = {
    glide: { opacity: 0.72, duration: 160 },
    article: { opacity: 0.72, duration: 180, y: 4 },
    enter: { opacity: 0.72, duration: 180, y: 6 },
    up: { opacity: 0.8, duration: 160, y: -4 },
    taxonomy: { opacity: 0.72, duration: 160, x: 6 },
    previous: { opacity: 0.76, duration: 180, x: -8 },
    next: { opacity: 0.76, duration: 180, x: 8 },
    panel: { opacity: 0.76, duration: 160, y: 4 },
    home: { opacity: 0.76, duration: 180, y: 4 },
    restore: { opacity: 1, duration: 0 },
    error: { opacity: 0.85, duration: 100 },
};

/** Share Swup's actual content animation with background and analytics consumers. */
export function prepareRouteMotion(event: RouteMotionEvent): RouteMotion {
    const native = event.viewTransition;
    const key = native ?? event;
    const existing = motions.get(key);
    if (existing) return existing;

    // Installation is a separate gate: before-swap consumers must not mistake
    // the gap before Swup's incoming animation hook for a completed transition.
    const installed = completion();
    const animationDone = completion();
    const canceled = completion();
    let animation: Animation | undefined;
    let started = false;
    let disposed = false;
    const clearAnimation = () => {
        const active = animation;
        animation = undefined;
        try {
            // Remove fill effects and restore the authored final styles. No
            // inline transform/opacity survives completion, failure or abort.
            active?.cancel();
        } catch {
            // Releasing an already detached effect must not hold up navigation.
        }
        animationDone.resolve();
    };
    const cancel = () => {
        if (disposed) return;
        disposed = true;
        started = true;
        clearAnimation();
        installed.resolve();
        canceled.resolve();
        event.signal?.removeEventListener("abort", cancel);
    };
    const ready = Promise.race([
        canceled.promise,
        Promise.all([settle(native?.ready), installed.promise]).then(() => undefined),
    ]);
    const finished = Promise.race([
        canceled.promise,
        Promise.all([settle(native?.finished), animationDone.promise]).then(() => undefined),
    ]);
    const motion: RouteMotion = {
        ready,
        finished,
        start(heading, options) {
            if (started) return;
            started = true;
            try {
                const preset = options?.preset ?? "glide";
                const mobile = window.matchMedia?.("(max-width: 768px)").matches;
                const target = getRouteMotionTarget(heading);
                if (
                    !target ||
                    preset === "none" ||
                    (options?.content && preset === "restore") ||
                    options?.skip ||
                    options?.browserMotion ||
                    document.hidden ||
                    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
                    typeof target.animate !== "function" ||
                    (mobile && preset === "restore")
                ) {
                    animationDone.resolve();
                    return;
                }
                const spec = options?.content ? regionMotions[preset] : headingMotions[preset];
                const keyframes: PropertyIndexedKeyframes = { opacity: [spec.opacity, 1] };
                // Phones use a pure fade. Explicit previous/next alone imply a
                // lateral reading direction; history never replays the entry.
                if (!mobile && (spec.x || spec.y)) {
                    keyframes.transform = [
                        `translate3d(${spec.x ?? 0}px, ${spec.y ?? 0}px, 0)`,
                        "translate3d(0px, 0px, 0)",
                    ];
                }
                animation = target.animate(keyframes, {
                    duration: mobile ? (options?.content ? 120 : 80) : spec.duration,
                    easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
                    fill: "both",
                });
                void animation.finished.then(clearAnimation, clearAnimation);
            } catch {
                clearAnimation();
            } finally {
                installed.resolve();
            }
        },
        cancel,
    };
    motions.set(key, motion);
    if (event.signal?.aborted) cancel();
    else event.signal?.addEventListener("abort", cancel, { once: true });
    void finished.then(() => event.signal?.removeEventListener("abort", cancel));
    return motion;
}
