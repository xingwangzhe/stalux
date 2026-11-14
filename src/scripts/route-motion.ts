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
    glide: { opacity: 0.86, duration: 50 },
    article: { opacity: 0.86, duration: 50 },
    enter: { opacity: 0.86, duration: 70, y: 6 },
    up: { opacity: 0.9, duration: 60, y: -4 },
    taxonomy: { opacity: 0.85, duration: 60 },
    previous: { opacity: 0.9, duration: 70, x: -8 },
    next: { opacity: 0.9, duration: 70, x: 8 },
    panel: { opacity: 0.9, duration: 60, y: 4 },
    home: { opacity: 0.9, duration: 60, y: 4 },
    restore: { opacity: 0.96, duration: 40 },
    error: { opacity: 0.9, duration: 40 },
};

const MAIN = "main[data-stalux-route]";
const ARTICLE = "article.stalux-article";
// Authored per page type by the theme, not inferred from layout: the article
// body, archive list, tag cloud, post list, word list, link list, home block.
const CONTENT = "[data-stalux-motion-content]";
// The one node a page nominates as its cue stage. Preferred over measuring,
// because measuring an article column forces a full layout of a document that
// is tens of thousands of pixels tall, before it has ever been painted.
const STAGE = "[data-stalux-motion-stage]";
// The bounded lead region of a page (its title block). It carries the entry
// offset when the stage itself is too tall to be a compositor layer.
const REGION = "[data-stalux-motion-region]";
// A persist node marks the three-column article shell. Those sidebars keep
// their identity across visits and must never travel with a route cue.
const PERSIST = "[data-swup-persist]";

/**
 * One gesture, two halves: the exit is shorter than the entry and the pair
 * stays inside ~330ms. Entrance uses a strong ease-out (quick arrival, soft
 * settle); the exit uses ease-in because an exit accelerates away.
 */
const ENTER_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
export const EXIT_EASING = "cubic-bezier(0.4, 0, 1, 1)";

interface StageMotion {
    opacity: number;
    /**
     * Enter offset in px. Positive y enters from below, positive x from the right.
     * Zero means a pure cross-fade: the column is replaced in place.
     */
    distance: number;
    axis: "x" | "y";
    duration: number;
    /** Outgoing half of the same gesture. */
    exit: number;
    /**
     * Offset for the bounded lead region when the stage cannot carry a
     * transform (a stage taller than two viewports, or a zero-distance preset
     * that still deserves a hint of movement).
     */
    nudge?: number;
}

// One entry per route kind, because the components are not interchangeable: an
// article opens from below and going back up to an index pulls away upward.
//
// Article-to-article is the exception: the reader keeps the same shell (sidebars,
// header) and only the column changes, so the column cross-fades in place and a
// 4px settle on the title block supplies the direction. Sliding a 28,000px
// column sideways made the whole page look like it jerked, and the shell already
// tells the reader where they are.
const stageMotions: Record<Exclude<RouteMotionPreset, "none">, StageMotion> = {
    // Article to article. The most travelled path in a blog: 180ms in, 150ms out.
    article: { opacity: 0, distance: 0, axis: "y", duration: 180, exit: 150, nudge: 4 },
    previous: { opacity: 0, distance: 0, axis: "x", duration: 150, exit: 130, nudge: -6 },
    next: { opacity: 0, distance: 0, axis: "x", duration: 150, exit: 130, nudge: 6 },
    // Reaching an article from any list or the home block: the one place a
    // larger offset is allowed, because the reader is looking at the top.
    enter: { opacity: 0, distance: 56, axis: "y", duration: 170, exit: 150 },
    home: { opacity: 0, distance: 48, axis: "y", duration: 160, exit: 140 },
    // Leaving an article for the archive or a taxonomy index.
    up: { opacity: 0, distance: -44, axis: "y", duration: 150, exit: 130 },
    // Moving between two taxonomy detail pages: lateral reading direction.
    taxonomy: { opacity: 0, distance: 36, axis: "x", duration: 140, exit: 130 },
    // About / links / words: single-panel pages.
    panel: { opacity: 0, distance: 44, axis: "y", duration: 150, exit: 130 },
    glide: { opacity: 0, distance: 40, axis: "y", duration: 140, exit: 120 },
    // History traversal restores what the reader already saw.
    restore: { opacity: 0, distance: 0, axis: "y", duration: 0, exit: 0 },
    error: { opacity: 0, distance: 0, axis: "y", duration: 130, exit: 110, nudge: 0 },
};

const laidOut = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
};

/**
 * The single node a route cue may animate for the current document.
 *
 * A page can nominate its stage; only when it does not is the largest authored
 * content stage measured. Measuring is the fallback, not the rule: on an article
 * the column is tens of thousands of pixels tall and measuring it forces a full
 * layout of the incoming document at the exact moment the entry cue needs to
 * start. Sidebars (persisted shells), the header and the footer never qualify.
 */
export function getRouteStage(): HTMLElement | null {
    const main = document.querySelector<HTMLElement>(MAIN);
    if (!main?.isConnected) return null;
    const authored = main.querySelector<HTMLElement>(STAGE);
    if (authored?.isConnected && !authored.closest(PERSIST)) return authored;
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

/** A stage taller than this cannot carry a transform without a huge texture. */
const MAX_STAGE_VIEWPORTS = 2;

/**
 * Whether the stage must stay on the cross-fade path.
 *
 * Transforming an element puts it on its own compositor layer sized to its full
 * bounds: an article column of 28,000px is roughly 78MB of texture on a 2560px
 * wide window, rasterised on the navigation's critical path. The guard is a
 * measurement, not an assumption, because a long post and a short one share the
 * same markup.
 */
export function isOversizedStage(stage: HTMLElement): boolean {
    const height = stage.getBoundingClientRect().height;
    return height > window.innerHeight * MAX_STAGE_VIEWPORTS;
}

/**
 * The bounded lead region of the current page: the title block, never the body.
 *
 * When the stage is too tall to transform, the cue keeps its meaning by moving
 * this node instead — it is what the reader is looking at on arrival, and it is
 * a few hundred pixels tall at most.
 */
export function getRouteRegion(): HTMLElement | null {
    const main = document.querySelector<HTMLElement>(MAIN);
    const region = main?.querySelector<HTMLElement>(REGION);
    if (!region?.isConnected || region.closest(PERSIST)) return null;
    const rect = region.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    // A region that is itself most of the viewport is a body, not a lead block.
    if (rect.height > Math.min(480, window.innerHeight * 0.6)) return null;
    return region;
}

export interface StageExit {
    opacity: number;
    distance: number;
    axis: "x" | "y";
    duration: number;
}

/** Offset applied to the outgoing document, continuing the entry direction. */
export function getStageExit(preset: RouteMotionPreset): StageExit | null {
    if (preset === "none") return null;
    const motion = stageMotions[preset];
    // Entering from below means leaving upward, so both halves read as one
    // continuous flow instead of an enter/leave bounce.
    return {
        opacity: motion.opacity,
        distance: -Math.round(motion.distance * 0.72),
        axis: motion.axis,
        duration: motion.exit,
    };
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
    if (!(focus?.isConnected && focus.hasAttribute("data-stalux-motion-focus"))) return null;
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
    const region = focus.closest?.<HTMLElement>(REGION);
    return region?.isConnected && visible(region, Math.min(420, window.innerHeight * 0.6))
        ? region
        : focus;
}

const regionMotions: Record<Exclude<RouteMotionPreset, "none">, HeadingMotion> = {
    glide: { opacity: 0.72, duration: 80 },
    article: { opacity: 0.72, duration: 90, y: 4 },
    enter: { opacity: 0.72, duration: 90, y: 6 },
    up: { opacity: 0.8, duration: 80, y: -4 },
    taxonomy: { opacity: 0.72, duration: 80, x: 6 },
    previous: { opacity: 0.76, duration: 90, x: -8 },
    next: { opacity: 0.76, duration: 90, x: 8 },
    panel: { opacity: 0.76, duration: 80, y: 4 },
    home: { opacity: 0.76, duration: 90, y: 4 },
    restore: { opacity: 1, duration: 0 },
    error: { opacity: 0.85, duration: 50 },
};

/** `translate3d` from an offset on one axis. Zero is not a transform at all. */
export function offsetTransform(distance: number, axis: "x" | "y"): string {
    return axis === "x" ? `translate3d(${distance}px, 0, 0)` : `translate3d(0, ${distance}px, 0)`;
}

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
    const running = new Set<Animation>();
    let started = false;
    let disposed = false;
    const clearAnimations = () => {
        const active = [...running];
        running.clear();
        for (const effect of active) {
            try {
                // Remove fill effects and restore the authored final styles. No
                // inline transform/opacity survives completion, failure or abort.
                effect.cancel();
            } catch {
                // Releasing an already detached effect must not hold up navigation.
            }
        }
        animationDone.resolve();
    };
    const cancel = () => {
        if (disposed) return;
        disposed = true;
        started = true;
        clearAnimations();
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
                    const duration = mobile ? Math.round(spec.duration * 0.9) : spec.duration;
                    // A stage taller than two viewports only cross-fades; the
                    // bounded title block carries the offset instead of putting
                    // a 28,000px layer on the compositor.
                    const oversized = isOversizedStage(stage);
                    const stageDistance = oversized ? 0 : distance;
                    // Whichever node can carry motion does: the column when it is
                    // short enough to be a layer, the title block otherwise. The
                    // nudge is the last resort for an in-place cross-fade.
                    const nudge = spec.nudge ?? 0;
                    const regionDistance =
                        stageDistance === 0
                            ? distance === 0
                                ? mobile
                                    ? Math.round(nudge * 0.6)
                                    : nudge
                                : distance
                            : 0;
                    const keyframes: PropertyIndexedKeyframes = { opacity: [spec.opacity, 1] };
                    // A zero distance is a cross-fade in place. Authoring a
                    // translate3d(0,0,0) would put the column on its own
                    // compositor layer for nothing.
                    if (stageDistance !== 0)
                        keyframes.transform = [
                            offsetTransform(stageDistance, spec.axis),
                            "translate3d(0, 0, 0)",
                        ];
                    const effect = stage.animate(keyframes, {
                        duration,
                        easing: ENTER_EASING,
                        fill: "both",
                    });
                    running.add(effect);
                    if (regionDistance !== 0) {
                        const region = getRouteRegion();
                        if (region)
                            running.add(
                                region.animate(
                                    {
                                        transform: [
                                            offsetTransform(regionDistance, spec.axis),
                                            "translate3d(0, 0, 0)",
                                        ],
                                    },
                                    { duration, easing: ENTER_EASING, fill: "both" },
                                ),
                            );
                    }
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
                    running.add(
                        target.animate(keyframes, {
                            duration: mobile ? (options?.content ? 60 : 40) : spec.duration,
                            easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
                            fill: "both",
                        }),
                    );
                }
                // The longest effect owns completion; a sibling nudge must not
                // settle the visit before the content cue does.
                void Promise.all([...running].map((effect) => settle(effect.finished))).then(
                    clearAnimations,
                    clearAnimations,
                );
            } catch {
                release?.();
                clearAnimations();
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
