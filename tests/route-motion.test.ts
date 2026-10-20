import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prepareRouteMotion } from "../src/scripts/route-motion";

function deferred() {
    let resolve = () => {};
    let reject = (_error: Error) => {};
    const promise = new Promise<void>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
}
const settle = async () => {
    for (let tick = 0; tick < 8; tick++) await Promise.resolve();
};
function animation() {
    const done = deferred();
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ finished: done.promise, cancel }));
    return { done, cancel, animate, main: { animate } as unknown as HTMLElement };
}
beforeEach(() => {
    vi.stubGlobal("document", { hidden: false });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
});
afterEach(() => vi.unstubAllGlobals());

describe("shared route motion", () => {
    it("caches by native transition, waits for synchronous installation and finishes with real WAAPI", async () => {
        const nativeReady = deferred();
        const nativeFinished = deferred();
        const event = {
            viewTransition: { ready: nativeReady.promise, finished: nativeFinished.promise },
        };
        const motion = prepareRouteMotion(event);
        expect(prepareRouteMotion({ viewTransition: event.viewTransition })).toBe(motion);
        const content = animation();
        let ready = false;
        let finished = false;
        void motion.ready.then(() => {
            ready = true;
        });
        void motion.finished.then(() => {
            finished = true;
        });
        nativeReady.resolve();
        nativeFinished.resolve();
        await settle();
        expect(ready).toBe(false);
        expect(finished).toBe(false);
        motion.start(content.main);
        expect(content.animate).toHaveBeenCalledWith(
            { opacity: [0.7, 1] },
            { duration: 100, easing: "ease-out" },
        );
        await settle();
        expect(ready).toBe(true);
        expect(finished).toBe(false);
        content.done.resolve();
        await motion.finished;
        expect(content.cancel).toHaveBeenCalledOnce();
    });

    it("does not report ready before the native snapshot is ready", async () => {
        const native = deferred();
        const motion = prepareRouteMotion({ viewTransition: { ready: native.promise } });
        motion.start(null);
        let ready = false;
        void motion.ready.then(() => {
            ready = true;
        });
        await settle();
        expect(ready).toBe(false);
        native.resolve();
        await motion.ready;
        expect(ready).toBe(true);
    });

    it("settles both gates on abort even when native promises never settle", async () => {
        const native = deferred();
        const controller = new AbortController();
        const motion = prepareRouteMotion({
            signal: controller.signal,
            viewTransition: { ready: native.promise, finished: native.promise },
        });
        const content = animation();
        motion.start(content.main);
        controller.abort();
        await Promise.all([motion.ready, motion.finished]);
        motion.cancel();
        motion.start(content.main);
        expect(content.animate).toHaveBeenCalledOnce();
        expect(content.cancel).toHaveBeenCalledOnce();
    });

    it("handles native rejection and real animation cancellation as normal completion", async () => {
        const motion = prepareRouteMotion({
            viewTransition: {
                ready: Promise.reject(new Error("skip")),
                finished: Promise.reject(new Error("skip")),
            },
        });
        const content = animation();
        motion.start(content.main);
        content.done.reject(new Error("canceled"));
        await Promise.all([motion.ready, motion.finished]);
        expect(content.cancel).toHaveBeenCalledOnce();
    });

    it.each(["reduced", "hidden", "missing", "unsupported", "throw", "ua-history"])(
        "safely abandons its animation for %s",
        async (mode) => {
            const content = animation();
            if (mode === "reduced")
                vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
            if (mode === "hidden") vi.stubGlobal("document", { hidden: true });
            if (mode === "throw")
                content.animate.mockImplementation(() => {
                    throw new Error("unavailable");
                });
            const main =
                mode === "missing"
                    ? null
                    : mode === "unsupported"
                      ? ({} as HTMLElement)
                      : content.main;
            const motion = prepareRouteMotion({});
            motion.start(main, { skip: mode === "ua-history" });
            await Promise.all([motion.ready, motion.finished]);
            expect(content.animate).toHaveBeenCalledTimes(mode === "throw" ? 1 : 0);
        },
    );

    it("starts at most once and never lets obsolete completion touch a newer animation", async () => {
        const old = animation();
        const current = animation();
        const first = prepareRouteMotion({});
        first.start(old.main);
        first.start(current.main);
        expect(old.animate).toHaveBeenCalledOnce();
        expect(current.animate).not.toHaveBeenCalled();
        first.cancel();
        const second = prepareRouteMotion({});
        second.start(current.main);
        old.done.resolve();
        await first.finished;
        await settle();
        expect(current.cancel).not.toHaveBeenCalled();
        current.done.resolve();
        await second.finished;
        expect(current.cancel).toHaveBeenCalledOnce();
    });

    it("cancels before installation and caches a transition without a native object", async () => {
        const controller = new AbortController();
        controller.abort();
        const event = { signal: controller.signal };
        const motion = prepareRouteMotion(event);
        expect(prepareRouteMotion(event)).toBe(motion);
        const content = animation();
        motion.start(content.main);
        await Promise.all([motion.ready, motion.finished]);
        expect(content.animate).not.toHaveBeenCalled();
    });
});
