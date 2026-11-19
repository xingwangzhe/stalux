import { afterEach, expect, it, vi } from "vitest";
import { installBackToTop } from "../src/scripts/back-to-top";

afterEach(() => vi.unstubAllGlobals());

it("only observes the threshold to control the native link's visibility", () => {
    const link = { hidden: true };
    const sentinel = {};
    const observe = vi.fn();
    let deliver: IntersectionObserverCallback;
    vi.stubGlobal("document", {
        querySelector: (selector: string) =>
            selector === "[data-stalux-back-to-top]" ? link : sentinel,
    });
    vi.stubGlobal(
        "IntersectionObserver",
        class {
            constructor(callback: IntersectionObserverCallback) {
                deliver = callback;
            }
            observe = observe;
        },
    );
    installBackToTop();
    expect(observe).toHaveBeenCalledExactlyOnceWith(sentinel);
    deliver!([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(link.hidden).toBe(false);
    deliver!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(link.hidden).toBe(true);
});
