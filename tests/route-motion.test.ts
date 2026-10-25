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
function animation(rect: Partial<DOMRect> = {}) {
    const done = deferred();
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ finished: done.promise, cancel }));
    return {
        done,
        cancel,
        animate,
        main: {
            animate,
            isConnected: true,
            hasAttribute: (name: string) => name === "data-stalux-motion-focus",
            getBoundingClientRect: () => ({
                width: 640,
                height: 80,
                top: 100,
                bottom: 180,
                left: 80,
                right: 720,
                ...rect,
            }),
        } as unknown as HTMLElement,
    };
}
beforeEach(() => {
    vi.stubGlobal("document", { hidden: false });
    vi.stubGlobal("window", {
        innerHeight: 900,
        innerWidth: 1440,
        matchMedia: () => ({ matches: false }),
    });
});
afterEach(() => vi.unstubAllGlobals());

describe("shared route motion", () => {
    it("shares installation and completion with all consumers without a second animation", async () => {
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
            { opacity: [0.86, 1] },
            { duration: 100, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", fill: "both" },
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

    it.each(["reduced", "hidden", "missing", "unsupported", "throw", "ua-history", "none"])(
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
            motion.start(main, {
                browserMotion: mode === "ua-history",
                preset: mode === "none" ? "none" : "glide",
            });
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

    it.each([
        ["enter", 6, "y", 140],
        ["up", -4, "y", 120],
        ["previous", -8, "x", 140],
        ["next", 8, "x", 140],
        ["panel", 4, "y", 120],
        ["home", 4, "y", 120],
    ] as const)("applies the bounded %s heading cue", async (preset, distance, axis, duration) => {
        const content = animation();
        const motion = prepareRouteMotion({});
        motion.start(content.main, { preset });
        const [frames, timing] = content.animate.mock.calls[0] as unknown as [
            PropertyIndexedKeyframes,
            KeyframeAnimationOptions,
        ];
        expect(frames.transform).toEqual([
            `translate3d(${axis === "x" ? distance : 0}px, ${axis === "y" ? distance : 0}px, 0)`,
            "translate3d(0px, 0px, 0)",
        ]);
        expect(timing.duration).toBe(duration);
        content.done.resolve();
        await motion.finished;
    });

    it.each([
        ["glide", 100, 0.86],
        ["article", 100, 0.86],
        ["taxonomy", 120, 0.85],
        ["restore", 80, 0.96],
        ["error", 80, 0.9],
    ] as const)("keeps %s as a pure heading fade", async (preset, duration, opacity) => {
        const content = animation();
        const motion = prepareRouteMotion({});
        motion.start(content.main, { preset });
        expect(content.animate).toHaveBeenCalledWith(
            { opacity: [opacity, 1] },
            expect.objectContaining({ duration }),
        );
        content.done.resolve();
        await motion.finished;
    });

    it.each(["enter", "up", "previous", "next", "panel", "home", "taxonomy"] as const)(
        "uses a short motionless fade for %s on phones",
        async (preset) => {
            vi.stubGlobal("window", {
                innerHeight: 844,
                innerWidth: 390,
                matchMedia: (query: string) => ({ matches: query === "(max-width: 768px)" }),
            });
            const content = animation({ width: 330, left: 30, right: 360 });
            const motion = prepareRouteMotion({});
            motion.start(content.main, { preset });
            expect(content.animate).toHaveBeenCalledWith(
                { opacity: [expect.any(Number), 1] },
                expect.objectContaining({ duration: 80 }),
            );
            content.done.resolve();
            await motion.finished;
        },
    );

    it.each([
        { top: 920, bottom: 1000 },
        { top: -100, bottom: -20 },
        { left: 1500, right: 1600 },
        { width: 0 },
        { height: 400, bottom: 500 },
    ])("skips off-screen, hidden or oversized headings without scrolling: %j", async (rect) => {
        const content = animation(rect);
        const motion = prepareRouteMotion({});
        motion.start(content.main, { preset: "restore" });
        await Promise.all([motion.ready, motion.finished]);
        expect(content.animate).not.toHaveBeenCalled();
    });

    it("never animates an unmarked main/body or a detached old heading", async () => {
        for (const properties of [{ hasAttribute: () => false }, { isConnected: false }]) {
            const content = animation();
            Object.assign(content.main, properties);
            const motion = prepareRouteMotion({});
            motion.start(content.main, { preset: "enter" });
            await Promise.all([motion.ready, motion.finished]);
            expect(content.animate).not.toHaveBeenCalled();
        }
    });

    it("restores phone history without replaying a heading entry", async () => {
        vi.stubGlobal("window", {
            innerHeight: 844,
            innerWidth: 390,
            matchMedia: (query: string) => ({ matches: query === "(max-width: 768px)" }),
        });
        const content = animation();
        const motion = prepareRouteMotion({});
        motion.start(content.main, { preset: "restore" });
        await Promise.all([motion.ready, motion.finished]);
        expect(content.animate).not.toHaveBeenCalled();
    });
});

describe("content entry motion", () => {
    it.each([false, true])("animates one content surface on phone=%s", async (phone) => {
        vi.stubGlobal("window", {
            matchMedia: (query: string) => ({ matches: phone && query === "(max-width: 768px)" }),
        });
        const content = animation({ height: 8000 });
        const motion = prepareRouteMotion({});
        motion.start(content.main, { content: true, preset: "article" });
        expect(content.animate).toHaveBeenCalledWith(
            {
                opacity: [0, 1],
                transform: [`translate3d(0px, ${phone ? 8 : 16}px, 0)`, "translate3d(0px, 0px, 0)"],
            },
            expect.objectContaining({ duration: phone ? 180 : 220 }),
        );
        content.done.resolve();
        await motion.finished;
        expect(content.cancel).toHaveBeenCalledOnce();
    });
    it("preserves history reading position without a content entry", async () => {
        const content = animation();
        const motion = prepareRouteMotion({});
        motion.start(content.main, { content: true, preset: "restore" });
        await motion.finished;
        expect(content.animate).not.toHaveBeenCalled();
    });
});
