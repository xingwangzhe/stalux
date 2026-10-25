import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cancelPageScroll, scrollPage } from "../src/scripts/smooth-scroll";

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
