export interface RouteMotionEvent {
    viewTransition?: {
        ready?: PromiseLike<unknown>;
        finished?: PromiseLike<unknown>;
    };
    signal?: AbortSignal;
}

export interface RouteMotion {
    ready: Promise<void>;
    finished: Promise<void>;
    start: (main: HTMLElement | null, options?: { skip?: boolean }) => void;
    cancel: () => void;
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

/** Share the native swap and the real content animation across all route consumers. */
export function prepareRouteMotion(event: RouteMotionEvent): RouteMotion {
    const native = event.viewTransition;
    const key = native ?? event;
    const existing = motions.get(key);
    if (existing) return existing;

    // Create these before swap: a consumer must not observe native.finished and
    // mistake the gap before after-swap installs WAAPI for completed motion.
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
        start(main, options) {
            if (started) return;
            started = true;
            try {
                if (
                    !main ||
                    options?.skip ||
                    document.hidden ||
                    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
                    typeof main.animate !== "function"
                ) {
                    animationDone.resolve();
                    return;
                }
                animation = main.animate(
                    { opacity: [0.7, 1] },
                    { duration: 100, easing: "ease-out" },
                );
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
