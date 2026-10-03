import { afterEach, describe, expect, it, vi } from "vitest";
import { mountBackToTop } from "../src/scripts/back-to-top";
import { registerPageLifecycle } from "../src/scripts/page-runtime";

function setup(reducedMotion = false) {
    const button = Object.assign(new EventTarget(), { hidden: true });
    const win = Object.assign(new EventTarget(), {
        scrollY: 0,
        scrollTo: vi.fn(),
        matchMedia: vi.fn(() => ({ matches: reducedMotion })),
    });
    const doc = Object.assign(new EventTarget(), { querySelector: vi.fn(() => button) });
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", doc);
    return { button, win, doc };
}

afterEach(() => vi.unstubAllGlobals());

describe("back to top", () => {
    it("shows only after scrolling and smoothly returns to the top", () => {
        const { button, win } = setup();
        const dispose = mountBackToTop();
        expect(button.hidden).toBe(true);
        win.scrollY = 240;
        win.dispatchEvent(new Event("scroll"));
        expect(button.hidden).toBe(false);
        button.dispatchEvent(new Event("click"));
        expect(win.scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0, behavior: "smooth" });
        win.scrollY = 0;
        win.dispatchEvent(new Event("scroll"));
        expect(button.hidden).toBe(true);
        dispose?.();
        button.dispatchEvent(new Event("click"));
        expect(win.scrollTo).toHaveBeenCalledOnce();
        win.scrollY = 500;
        win.dispatchEvent(new Event("scroll"));
        expect(button.hidden).toBe(true);
    });

    it("respects reduced motion even if CSS enables smooth scrolling", () => {
        const { button, win } = setup(true);
        win.scrollY = 800;
        const dispose = mountBackToTop();
        expect(button.hidden).toBe(false);
        button.dispatchEvent(new Event("click"));
        expect(win.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
        dispose?.();
    });

    it("tolerates pages without a button", () => {
        const { doc } = setup();
        doc.querySelector.mockReturnValue(null as never);
        expect(mountBackToTop()).toBeUndefined();
    });

    it("cleans up the old DOM and binds the new button once after soft navigation", () => {
        const { button: oldButton, win, doc } = setup();
        const unregister = registerPageLifecycle("back-to-top-test", mountBackToTop, {
            host: {},
            target: doc,
            queueTask: (callback) => callback(),
        });
        doc.dispatchEvent(new Event("astro:page-load"));
        doc.dispatchEvent(new Event("astro:before-swap"));
        const newButton = Object.assign(new EventTarget(), { hidden: true });
        doc.querySelector.mockReturnValue(newButton);
        win.scrollY = 500;
        doc.dispatchEvent(new Event("astro:page-load"));
        doc.dispatchEvent(new Event("astro:page-load"));
        oldButton.dispatchEvent(new Event("click"));
        expect(win.scrollTo).not.toHaveBeenCalled();
        expect(newButton.hidden).toBe(false);
        newButton.dispatchEvent(new Event("click"));
        expect(win.scrollTo).toHaveBeenCalledOnce();
        unregister();
    });
});
