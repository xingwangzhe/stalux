import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelPageScroll, glideToTop, scrollPage } from "../src/scripts/smooth-scroll";

let host: EventTarget;
let element: Element & { scrollTo: ReturnType<typeof vi.fn> };
beforeEach(() => {
    vi.useFakeTimers();
    host = Object.assign(new EventTarget(), { matchMedia: () => ({ matches: false }) });
    element = Object.assign(new EventTarget(), {
        scrollTop: 0,
        scrollLeft: 0,
        scrollTo: vi.fn(),
    }) as unknown as typeof element;
    vi.stubGlobal("window", host);
    vi.stubGlobal("document", { documentElement: element });
});
afterEach(() => {
    cancelPageScroll();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});
it.each(["scrollend", "wheel", "touchstart", "keydown", "timeout", "navigation"])(
    "cleans up and completes once after %s",
    (reason) => {
        const add = vi.spyOn(host, "addEventListener");
        const remove = vi.spyOn(host, "removeEventListener");
        const end = vi.fn();
        scrollPage(element, 900, 0, true, vi.fn(), end);
        expect(element.scrollTo).toHaveBeenCalledWith({ top: 900, left: 0, behavior: "smooth" });
        if (reason === "timeout") vi.advanceTimersByTime(1500);
        else if (reason === "navigation") cancelPageScroll();
        else host.dispatchEvent(new Event(reason));
        expect(end).toHaveBeenCalledOnce();
        for (const [event, callback] of add.mock.calls)
            expect(remove).toHaveBeenCalledWith(event, callback);
        host.dispatchEvent(new Event("wheel"));
        vi.runAllTimers();
        expect(end).toHaveBeenCalledOnce();
    },
);
it("settles the previous scroll before starting a replacement", () => {
    const end = vi.fn();
    scrollPage(element, 900, 0, true, vi.fn(), end);
    scrollPage(element, 100, 0, true, vi.fn(), vi.fn());
    expect(end).toHaveBeenCalledOnce();
});
it("does not install listeners or timers for a no-op or reduced motion", () => {
    const add = vi.spyOn(host, "addEventListener");
    const end = vi.fn();
    scrollPage(element, 0, 0, true, vi.fn(), end);
    Object.assign(host, { matchMedia: () => ({ matches: true }) });
    scrollPage(element, 900, 0, true, vi.fn(), end);
    expect(add).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(end).toHaveBeenCalledTimes(2);
});

describe("glideToTop", () => {
    let frames: FrameRequestCallback[];
    let clock: number;
    const runFrame = (advance = 16) => {
        const step = frames.shift();
        if (!step) return false;
        clock += advance;
        step(clock);
        return true;
    };
    beforeEach(() => {
        frames = [];
        clock = 1000;
        vi.stubGlobal("requestAnimationFrame", (step: FrameRequestCallback) => {
            frames.push(step);
            return frames.length;
        });
        vi.stubGlobal("cancelAnimationFrame", () => {});
        vi.spyOn(performance, "now").mockImplementation(() => clock);
    });
    afterEach(() => vi.restoreAllMocks());

    it("walks the outgoing document back to the top in bounded frames", async () => {
        element.scrollTop = 4000;
        const glide = glideToTop();
        expect(element.scrollTop).toBe(4000);
        const seen: number[] = [];
        while (runFrame()) seen.push(element.scrollTop);
        await glide.promise;
        expect(element.scrollTop).toBe(0);
        expect(seen.length).toBeGreaterThan(2);
        // Ease-out: strictly decreasing, never overshooting past the top.
        expect([...seen].sort((left, right) => right - left)).toEqual(seen);
        expect(Math.min(...seen)).toBeGreaterThanOrEqual(0);
    });

    it("returns immediately at the top, when hidden and under reduced motion", async () => {
        await glideToTop().promise;
        expect(frames).toHaveLength(0);

        element.scrollTop = 900;
        Object.assign(host, { matchMedia: () => ({ matches: true }) });
        await glideToTop().promise;
        expect(frames).toHaveLength(0);
        expect(element.scrollTop).toBe(900);

        Object.assign(host, { matchMedia: () => ({ matches: false }) });
        vi.stubGlobal("document", { documentElement: element, hidden: true });
        await glideToTop().promise;
        expect(frames).toHaveLength(0);
    });

    it("stops where it is when the reader takes over", async () => {
        element.scrollTop = 2000;
        const glide = glideToTop();
        runFrame();
        const midway = element.scrollTop;
        host.dispatchEvent(new Event("wheel"));
        await glide.promise;
        expect(element.scrollTop).toBe(midway);
        // A frame already queued cannot move the page after the takeover.
        runFrame();
        expect(element.scrollTop).toBe(midway);
        glide.cancel();
    });
});
