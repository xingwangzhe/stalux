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
            { duration: 50, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", fill: "both" },
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
        ["enter", 6, "y", 70],
        ["up", -4, "y", 60],
        ["previous", -8, "x", 70],
        ["next", 8, "x", 70],
        ["panel", 4, "y", 60],
        ["home", 4, "y", 60],
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
        ["glide", 50, 0.86],
        ["article", 50, 0.86],
        ["taxonomy", 60, 0.85],
        ["restore", 40, 0.96],
        ["error", 40, 0.9],
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
                expect.objectContaining({ duration: 40 }),
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

describe("route stage entry motion", () => {
    function stageNode(label: string, area: number, options: { inPersist?: boolean } = {}) {
        const inPersist = options.inPersist ?? false;
        const done = deferred();
        const cancel = vi.fn();
        const animate = vi.fn(() => ({ finished: done.promise, cancel }));
        return {
            label,
            animate,
            cancel,
            done,
            node: {
                label,
                isConnected: true,
                animate,
                getBoundingClientRect: () => ({
                    width: 1000,
                    height: area / 1000,
                    top: 0,
                    bottom: area / 1000,
                    left: 0,
                    right: 1000,
                }),
                closest: (selector: string) =>
                    selector === "[data-swup-persist]" && inPersist ? {} : null,
            } as unknown as HTMLElement,
        };
    }

    function stubStage(parts: { article?: unknown; content?: unknown[]; mainPersist?: boolean }) {
        const main = {
            isConnected: true,
            getBoundingClientRect: () => ({
                width: 1000,
                height: 2000,
                top: 0,
                bottom: 2000,
                left: 0,
                right: 1000,
            }),
            querySelector: (selector: string) => {
                if (selector === "article.stalux-article") return parts.article ?? null;
                if (selector === "[data-swup-persist]") return parts.mainPersist ? {} : null;
                return null;
            },
            querySelectorAll: () => parts.content ?? [],
        };
        vi.stubGlobal("document", {
            hidden: false,
            querySelector: (selector: string) =>
                selector === "main[data-stalux-route]" ? main : null,
        });
    }

    it("moves the article column, never the whole shell", async () => {
        const article = stageNode("article", 1000 * 4000);
        stubStage({ article: article.node, mainPersist: true });
        const motion = prepareRouteMotion({});
        motion.start(null, { content: true, preset: "enter" });
        expect(article.animate).toHaveBeenCalledWith(
            { opacity: [0, 1], transform: ["translate3d(0, 56px, 0)", "translate3d(0, 0, 0)"] },
            expect.objectContaining({ duration: 170, fill: "both" }),
        );
        article.done.resolve();
        await motion.finished;
        expect(article.cancel).toHaveBeenCalledOnce();
    });

    // Article to article keeps the shell and swaps the column in place: the
    // reader stays in the same reading position, so the column must not travel.
    it.each(["previous", "next", "article"] as const)(
        "cross-fades the article column in place for %s",
        async (preset) => {
            const article = stageNode("article", 1000 * 4000);
            stubStage({ article: article.node, mainPersist: true });
            const motion = prepareRouteMotion({});
            motion.start(null, { content: true, preset });
            const [frames, timing] = article.animate.mock.calls[0] as unknown as [
                PropertyIndexedKeyframes,
                KeyframeAnimationOptions,
            ];
            expect(frames.opacity).toEqual([0, 1]);
            expect(frames.transform).toBeUndefined();
            expect(timing.duration).toBe(150);
            article.done.resolve();
            await motion.finished;
        },
    );

    it("leaves an article upward when the reader heads to an index", async () => {
        const article = stageNode("article", 1000 * 4000);
        stubStage({ article: article.node, mainPersist: true });
        const motion = prepareRouteMotion({});
        motion.start(null, { content: true, preset: "up" });
        expect(article.animate).toHaveBeenCalledWith(
            { opacity: [0, 1], transform: ["translate3d(0, -44px, 0)", "translate3d(0, 0, 0)"] },
            expect.anything(),
        );
        article.done.resolve();
        await motion.finished;
    });

    it("takes the largest authored content stage on a list page", async () => {
        const heading = stageNode("heading-description", 900 * 40);
        const list = stageNode("archive-list", 1000 * 1200);
        stubStage({ content: [heading.node, list.node] });
        const motion = prepareRouteMotion({});
        motion.start(null, { content: true, preset: "glide" });
        expect(list.animate).toHaveBeenCalledOnce();
        expect(heading.animate).not.toHaveBeenCalled();
        list.done.resolve();
        heading.done.resolve();
        await motion.finished;
    });

    it("skips any candidate that sits inside a persisted shell", async () => {
        const sidebar = stageNode("sidebar", 400 * 900, { inPersist: true });
        const body = stageNode("article-body", 800 * 600);
        stubStage({ content: [sidebar.node, body.node] });
        const motion = prepareRouteMotion({});
        motion.start(null, { content: true, preset: "enter" });
        expect(sidebar.animate).not.toHaveBeenCalled();
        expect(body.animate).toHaveBeenCalledOnce();
        body.done.resolve();
        sidebar.done.resolve();
        await motion.finished;
    });

    it("falls back to main only where no persisted shell lives", async () => {
        const mainOnly = {
            isConnected: true,
            animate: vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn() })),
            getBoundingClientRect: () => ({
                width: 1000,
                height: 2000,
                top: 0,
                bottom: 2000,
                left: 0,
                right: 1000,
            }),
            querySelector: () => null,
            querySelectorAll: () => [],
        };
        vi.stubGlobal("document", {
            hidden: false,
            querySelector: () => mainOnly,
        });
        const motion = prepareRouteMotion({});
        motion.start(null, { content: true, preset: "home" });
        expect(mainOnly.animate).toHaveBeenCalledOnce();
        await motion.finished;

        // With a persisted shell present, an unmarked document gets no cue at all.
        const shelled = {
            ...mainOnly,
            animate: vi.fn(),
            querySelector: (s: string) => (s === "[data-swup-persist]" ? {} : null),
        };
        vi.stubGlobal("document", { hidden: false, querySelector: () => shelled });
        const second = prepareRouteMotion({});
        second.start(null, { content: true, preset: "home" });
        await second.finished;
        expect(shelled.animate).not.toHaveBeenCalled();
    });

    it("releases the exit fill in the same block that starts the entry cue", async () => {
        const article = stageNode("article", 1000 * 4000);
        stubStage({ article: article.node, mainPersist: true });
        const releaseOutgoing = vi.fn();
        const motion = prepareRouteMotion({});
        motion.start(null, { content: true, preset: "enter", releaseOutgoing });
        expect(releaseOutgoing).toHaveBeenCalledOnce();
        expect(article.animate).toHaveBeenCalledOnce();
        article.done.resolve();
        await motion.finished;
    });

    it.each([
        ["missing stage", () => stubStage({ article: null, mainPersist: true })],
        ["skipped cue", () => stubStage({ article: stageNode("a", 1000).node, mainPersist: true })],
        [
            "reduced motion",
            () => {
                stubStage({ article: stageNode("a", 1000).node, mainPersist: true });
                vi.stubGlobal("window", {
                    innerWidth: 1440,
                    innerHeight: 900,
                    matchMedia: () => ({ matches: true }),
                });
            },
        ],
    ])("always releases the exit fill on %s", async (_label, setup) => {
        setup();
        const releaseOutgoing = vi.fn();
        const motion = prepareRouteMotion({});
        motion.start(null, {
            content: true,
            preset: "enter",
            skip: _label === "skipped cue" ? true : undefined,
            releaseOutgoing,
        });
        await Promise.all([motion.ready, motion.finished]);
        expect(releaseOutgoing).toHaveBeenCalledOnce();
    });

    it("keeps phones shorter without dropping the movement", async () => {
        vi.stubGlobal("window", {
            innerWidth: 390,
            innerHeight: 844,
            matchMedia: (q: string) => ({ matches: q === "(max-width: 768px)" }),
        });
        const article = stageNode("article", 390 * 3000);
        stubStage({ article: article.node, mainPersist: true });
        const motion = prepareRouteMotion({});
        motion.start(null, { content: true, preset: "enter" });
        expect(article.animate).toHaveBeenCalledWith(
            { opacity: [0, 1], transform: ["translate3d(0, 34px, 0)", "translate3d(0, 0, 0)"] },
            expect.objectContaining({ duration: 153 }),
        );
        article.done.resolve();
        await motion.finished;
    });
});
