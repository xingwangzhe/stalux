import { afterEach, describe, expect, it, vi } from "vitest";
import { installBackToTop } from "../src/scripts/back-to-top";

interface ObserverEntry {
    isIntersecting: boolean;
}

interface MockObserver {
    callback: (entries: ObserverEntry[]) => void;
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
}

const observers: MockObserver[] = [];

class MockIntersectionObserver {
    callback: MockObserver["callback"];
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(callback: MockObserver["callback"]) {
        this.callback = callback;
        observers.push(this as unknown as MockObserver);
    }
}

interface BackToTopWindow extends Window {
    __STALUX_BACK_TO_TOP__?: boolean;
}

function setup(reducedMotion = false, present = true) {
    const button = Object.assign(new EventTarget(), { hidden: true });
    const sentinel = new EventTarget();
    const win = Object.assign(new EventTarget(), {
        scrollTo: vi.fn(),
        matchMedia: vi.fn(() => ({ matches: reducedMotion })),
    }) as unknown as BackToTopWindow;
    const doc = Object.assign(new EventTarget(), {
        querySelector: vi.fn((selector: string) =>
            present ? (selector === "[data-stalux-back-to-top]" ? button : sentinel) : null,
        ),
    });
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    return { button, sentinel, win, doc };
}

afterEach(() => {
    observers.length = 0;
    vi.unstubAllGlobals();
});

describe("back to top", () => {
    it("drives visibility from the sentinel observer instead of reading scroll position", () => {
        const { button, win } = setup();
        installBackToTop();
        expect(win.__STALUX_BACK_TO_TOP__).toBe(true);
        const observer = observers.at(-1);
        expect(observer?.observe).toHaveBeenCalledTimes(1);
        observer?.callback([{ isIntersecting: true }]);
        expect(button.hidden).toBe(true);
        observer?.callback([{ isIntersecting: false }]);
        expect(button.hidden).toBe(false);
        button.dispatchEvent(new Event("click"));
        expect(win.scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0, behavior: "smooth" });
    });

    it("respects reduced motion even if CSS enables smooth scrolling", () => {
        const { button, win } = setup(true);
        installBackToTop();
        observers.at(-1)?.callback([{ isIntersecting: false }]);
        button.dispatchEvent(new Event("click"));
        expect(win.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
    });

    it("tolerates pages without the persisted shells", () => {
        const { win } = setup(false, false);
        installBackToTop();
        expect(observers.length).toBe(0);
        expect(win.__STALUX_BACK_TO_TOP__).toBeUndefined();
    });

    it("installs once per document because the footer and sentinel persist", () => {
        const { button, win } = setup();
        installBackToTop();
        installBackToTop();
        expect(observers.length).toBe(1);
        observers.at(-1)?.callback([{ isIntersecting: false }]);
        expect(button.hidden).toBe(false);
        button.dispatchEvent(new Event("click"));
        expect(win.scrollTo).toHaveBeenCalledOnce();
    });
});
