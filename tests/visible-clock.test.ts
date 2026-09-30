import { afterEach, describe, expect, it, vi } from "vitest";
import { observeVisibleClock } from "../src/scripts/visible-clock";

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("visible wall clocks", () => {
    it("stops while offscreen or hidden and updates immediately on return", () => {
        vi.useFakeTimers();
        const doc = Object.assign(new EventTarget(), { hidden: false });
        let notify: IntersectionObserverCallback = () => undefined;
        const disconnect = vi.fn();
        vi.stubGlobal("document", doc);
        vi.stubGlobal(
            "IntersectionObserver",
            class {
                constructor(callback: IntersectionObserverCallback) {
                    notify = callback;
                }
                observe() {}
                disconnect = disconnect;
            },
        );
        const update = vi.fn();
        const dispose = observeVisibleClock({} as Element, update);
        vi.advanceTimersByTime(3000);
        expect(update).not.toHaveBeenCalled();
        notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
        expect(update).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(2000);
        expect(update).toHaveBeenCalledTimes(3);
        doc.hidden = true;
        doc.dispatchEvent(new Event("visibilitychange"));
        vi.advanceTimersByTime(5000);
        expect(update).toHaveBeenCalledTimes(3);
        doc.hidden = false;
        doc.dispatchEvent(new Event("visibilitychange"));
        expect(update).toHaveBeenCalledTimes(4);
        notify(
            [{ isIntersecting: false } as IntersectionObserverEntry],
            {} as IntersectionObserver,
        );
        vi.advanceTimersByTime(3000);
        expect(update).toHaveBeenCalledTimes(4);
        dispose();
        doc.dispatchEvent(new Event("visibilitychange"));
        vi.advanceTimersByTime(3000);
        expect(update).toHaveBeenCalledTimes(4);
        expect(disconnect).toHaveBeenCalledOnce();
    });
});
