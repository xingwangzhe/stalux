import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installNavigationProgress } from "../src/scripts/navigation-progress";

let doc: EventTarget;
let win: EventTarget;
let bar: { dataset: Record<string, string>; style: { transform: string } };
const fire = (name: string, data = {}) => {
    const event = Object.assign(new Event(name, { cancelable: true }), data);
    doc.dispatchEvent(event);
    return event;
};
const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
        resolve = done;
    });
    return { promise, resolve };
};
function start(loader = async () => {}) {
    const controller = new AbortController();
    const event = fire("astro:before-preparation", {
        signal: controller.signal,
        loader,
    }) as Event & { loader: () => Promise<void> };
    return { controller, event };
}
function swap(signal: AbortSignal, finished: Promise<void>) {
    fire("astro:before-swap", { signal, viewTransition: { finished } });
    fire("astro:after-swap");
}
beforeEach(() => {
    vi.useFakeTimers();
    doc = new EventTarget();
    win = new EventTarget();
    bar = { dataset: {}, style: { transform: "" } };
    vi.stubGlobal("document", Object.assign(doc, { querySelector: () => bar }));
    vi.stubGlobal("window", win);
    installNavigationProgress();
});
afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});
describe("stage-based navigation progress", () => {
    it("holds during loading and waits for scripts and animation", async () => {
        const load = deferred(),
            animation = deferred();
        const { event, controller } = start(() => load.promise);
        const loading = event.loader();
        await vi.advanceTimersByTimeAsync(5000);
        expect(bar.dataset.stage).toBe("loading");
        const progress = Number(bar.style.transform.slice(7, -1));
        expect(progress).toBeGreaterThan(0.08);
        expect(progress).toBeLessThan(0.6);
        load.resolve();
        await loading;
        expect(bar.dataset.stage).toBe("prepared");
        swap(controller.signal, animation.promise);
        expect(bar.dataset.stage).toBe("swapped");
        fire("astro:page-load");
        expect(bar.dataset.stage).toBe("loaded");
        animation.resolve();
        await Promise.resolve();
        expect(bar.dataset.stage).toBe("complete");
        await vi.advanceTimersByTimeAsync(250);
        expect(bar.dataset.stage).toBeUndefined();
        expect(vi.getTimerCount()).toBe(0);
    });
    it("waits for scripts if animation finishes first or is skipped", async () => {
        const { event, controller } = start();
        await event.loader();
        swap(controller.signal, Promise.reject(new Error("skipped")));
        await Promise.resolve();
        expect(bar.dataset.stage).toBe("swapped");
        fire("astro:page-load");
        expect(bar.dataset.stage).toBe("complete");
    });
    it("ignores initial load and obsolete work during rapid navigation", async () => {
        fire("astro:page-load");
        expect(bar.dataset.stage).toBeUndefined();
        const oldLoad = deferred(),
            oldAnimation = deferred();
        const first = start(() => oldLoad.promise),
            pending = first.event.loader();
        swap(first.controller.signal, oldAnimation.promise);
        first.controller.abort();
        const second = start();
        oldLoad.resolve();
        oldAnimation.resolve();
        await pending;
        fire("astro:page-load");
        expect(bar.dataset.stage).toBe("loading");
        await second.event.loader();
        swap(second.controller.signal, Promise.resolve());
        await Promise.resolve();
        fire("astro:page-load");
        expect(bar.dataset.stage).toBe("complete");
        const third = start();
        await vi.advanceTimersByTimeAsync(1000);
        expect(bar.dataset.stage).toBe("loading");
        third.controller.abort();
        expect(bar.dataset.stage).toBeUndefined();
    });
    it("clears failures, canceled preparation, fallback and pagehide", async () => {
        const failed = start(async () => {
            throw new Error("loader failed");
        });
        await expect(failed.event.loader()).rejects.toThrow("loader failed");
        expect(bar.dataset.stage).toBeUndefined();
        const fallback = start();
        fallback.event.preventDefault();
        await fallback.event.loader();
        expect(bar.dataset.stage).toBeUndefined();
        const canceled = start();
        canceled.event.preventDefault();
        await Promise.resolve();
        expect(bar.dataset.stage).toBeUndefined();
        start();
        win.dispatchEvent(new Event("pagehide"));
        expect(bar.dataset.stage).toBeUndefined();
        expect(vi.getTimerCount()).toBe(0);
    });
});
