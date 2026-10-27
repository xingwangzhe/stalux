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
    /** Animate the route's own content stage instead of a bounded heading area. */
    content?: boolean;
    preset?: RouteMotionPreset;
    browserMotion?: boolean;
    /** Releases the outgoing fill effect inside the entry cue's sync block. */
    releaseOutgoing?: () => void;
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

const MAIN = "main[data-stalux-route]";
const ARTICLE = "article.stalux-article";
// Authored per page type by the theme, not inferred from layout: the article
// body, archive list, tag cloud, post list, word list, link list, home block.
const CONTENT = "[data-stalux-motion-content]";
// A persist node marks the three-column article shell. Those sidebars keep
// their identity across visits and must never travel with a route cue.
const PERSIST = "[data-swup-persist]";

interface StageMotion {
    opacity: number;
    /** Enter offset in px. Positive y enters from below, positive x from the right. */
    distance: number;
    axis: "x" | "y";
    duration: number;
}

// One entry per route kind, because the components are not interchangeable: an
// article opens from below, the next article slides in from the side that the
// reader is heading toward, and going back up to an index pulls away upward.
const stageMotions: Record<Exclude<RouteMotionPreset, "none">, StageMotion> = {
    // Article-to-article keeps a lateral direction: previous/next already says
    // which way the reading order goes, so the cue repeats that, not a fade.
    previous: { opacity: 0, distance: -36, axis: "x", duration: 300 },
    next: { opacity: 0, distance: 36, axis: "x", duration: 300 },
    // Entering a different article without a reading-direction trigger.
    article: { opacity: 0, distance: 40, axis: "y", duration: 300 },
    // Reaching an article from any list or the home block.
    enter: { opacity: 0, distance: 56, axis: "y", duration: 340 },
    home: { opacity: 0, distance: 48, axis: "y", duration: 320 },
    // Leaving an article for the archive or a taxonomy index.
    up: { opacity: 0, distance: -44, axis: "y", duration: 300 },
    // Moving between two taxonomy detail pages.
    taxonomy: { opacity: 0, distance: 36, axis: "y", duration: 280 },
    // About / links / words: single-panel pages.
    panel: { opacity: 0, distance: 44, axis: "y", duration: 300 },
    glide: { opacity: 0, distance: 40, axis: "y", duration: 280 },
    // History traversal restores what the reader already saw.
    restore: { opacity: 0, distance: -36, axis: "y", duration: 280 },
    error: { opacity: 0, distance: 28, axis: "y", duration: 260 },
};

const laidOut = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
};

/**
 * The single node a route cue may animate for the current document.
 *
 * Picks the largest authored content stage, so an article moves its own column
 * and an archive moves its list, while sidebars (persisted shells), the header
 * and the footer stay untouched. Falls back to `main` only for pages without a
 * persisted shell inside it.
 */
export function getRouteStage(): HTMLElement | null {
    const main = document.querySelector<HTMLElement>(MAIN);
    if (!main?.isConnected) return null;
    const candidates: HTMLElement[] = [];
    const article = main.querySelector<HTMLElement>(ARTICLE);
    if (article) candidates.push(article);
    for (const element of main.querySelectorAll<HTMLElement>(CONTENT)) candidates.push(element);

    let stage: HTMLElement | null = null;
    let area = 0;
    for (const element of candidates) {
        // A stage inside a persisted subtree is the shell itself.
        if (!element.isConnected || element.closest(PERSIST)) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        const current = rect.width * rect.height;
        if (current > area) {
            area = current;
            stage = element;
        }
    }
    if (stage) return stage;
    if (main.querySelector(PERSIST)) return null;
    return laidOut(main) ? main : null;
}

/** Offset applied to the outgoing document, continuing the entry direction. */
export function getStageExit(preset: RouteMotionPreset): StageMotion | null {
    if (preset === "none") return null;
    const motion = stageMotions[preset];
    // Entering from below means leaving upward, so both halves read as one
    // continuous flow instead of an enter/leave bounce.
    return { ...motion, distance: -Math.round(motion.distance * 0.72) };
}

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
            // Every exit path must release the outgoing fill, or the swapped
            // document stays transparent behind a cancelled cue.
            const release = options?.releaseOutgoing;
            try {
                const preset = options?.preset ?? "glide";
                const mobile = window.matchMedia?.("(max-width: 768px)").matches;
                if (
                    options?.skip ||
                    options?.browserMotion ||
                    preset === "none" ||
                    (options?.content && preset === "restore") ||
                    // History never replays an entry on a phone: the reader is
                    // returning to a position, not arriving somewhere new.
                    (mobile && preset === "restore") ||
                    document.hidden ||
                    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
                ) {
                    release?.();
                    animationDone.resolve();
                    return;
                }
                const stage = options?.content ? getRouteStage() : null;
                const target = stage ?? getRouteMotionTarget(heading);
                if (!target || typeof target.animate !== "function") {
                    release?.();
                    animationDone.resolve();
                    return;
                }
                // Cancelling the outgoing fill and starting the entry cue must
                // share one synchronous block. Split across frames, the reader
                // sees the new document at full opacity for a frame first.
                release?.();
                if (stage) {
                    const spec = stageMotions[preset];
                    // Phones get a shorter throw; the same offset reads as a much
                    // larger move on a narrow viewport.
                    const distance = mobile ? Math.round(spec.distance * 0.6) : spec.distance;
                    const from =
                        spec.axis === "x"
                            ? `translate3d(${distance}px, 0, 0)`
                            : `translate3d(0, ${distance}px, 0)`;
                    animation = stage.animate(
                        {
                            opacity: [spec.opacity, 1],
                            transform: [from, "translate3d(0, 0, 0)"],
                        },
                        {
                            duration: mobile ? Math.round(spec.duration * 0.9) : spec.duration,
                            // Strong ease-out: quick arrival, soft settle. The
                            // built-in ease-out is too weak to read at this size.
                            easing: "cubic-bezier(0.23, 1, 0.32, 1)",
                            fill: "both",
                        },
                    );
                } else {
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
                }
                void animation.finished.then(clearAnimation, clearAnimation);
            } catch {
                release?.();
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
