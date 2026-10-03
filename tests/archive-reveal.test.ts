import { afterEach, describe, expect, it, vi } from "vitest";
import { mountArchiveReveal } from "../src/scripts/archive-reveal";
import { registerPageLifecycle } from "../src/scripts/page-runtime";

function setup(count = 2) {
    const animations: ReturnType<typeof makeAnimation>[] = [];
    function makeAnimation() {
        return Object.assign(new EventTarget(), { cancel: vi.fn() });
    }
    const months = Array.from({ length: count }, () => ({
        animate: vi.fn(() => {
            const animation = makeAnimation();
            animations.push(animation);
            return animation;
        }),
    }));
    const motion = Object.assign(new EventTarget(), { matches: false });
    const print = Object.assign(new EventTarget(), { matches: false });
    const win = Object.assign(new EventTarget(), {
        matchMedia: vi.fn((query: string) => (query === "print" ? print : motion)),
    });
    const doc = Object.assign(new EventTarget(), {
        hidden: false,
        querySelectorAll: vi.fn(() => months),
    });
    const observers: Observer[] = [];
    class Observer {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
        constructor(public callback: IntersectionObserverCallback) {
            observers.push(this);
        }
        emit(index: number, isIntersecting = true) {
            this.callback(
                [
                    { target: months[index], isIntersecting },
                ] as unknown as IntersectionObserverEntry[],
                this as unknown as IntersectionObserver,
            );
        }
    }
    vi.stubGlobal("document", doc);
    vi.stubGlobal("window", win);
    vi.stubGlobal("IntersectionObserver", Observer);
    return { months, animations, motion, print, win, doc, observers };
}

afterEach(() => vi.unstubAllGlobals());

describe("archive month reveal", () => {
    it("observes months and animates each once with the agreed timing", () => {
        const { months, observers, animations } = setup();
        const dispose = mountArchiveReveal();
        expect(observers[0]?.observe).toHaveBeenCalledTimes(2);
        observers[0]?.emit(0, false);
        expect(months[0]?.animate).not.toHaveBeenCalled();
        observers[0]?.emit(0);
        observers[0]?.emit(0);
        observers[0]?.emit(1);
        expect(months[0]?.animate).toHaveBeenCalledExactlyOnceWith(
            [
                { opacity: 0, transform: "translateY(8px)" },
                { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
        expect(months[1]?.animate).toHaveBeenCalledOnce();
        animations[0]?.dispatchEvent(new Event("finish"));
        expect(animations[0]?.cancel).toHaveBeenCalledOnce();
        dispose?.();
        expect(animations[0]?.cancel).toHaveBeenCalledOnce();
        expect(animations[1]?.cancel).toHaveBeenCalledOnce();
    });

    it("defers background entries and only reveals still-visible months on return", () => {
        const { doc, observers, months, animations } = setup();
        const dispose = mountArchiveReveal();
        doc.hidden = true;
        observers[0]?.emit(0);
        observers[0]?.emit(1);
        observers[0]?.emit(1, false);
        expect(months[0]?.animate).not.toHaveBeenCalled();
        doc.hidden = false;
        doc.dispatchEvent(new Event("visibilitychange"));
        expect(months[0]?.animate).toHaveBeenCalledOnce();
        expect(months[1]?.animate).not.toHaveBeenCalled();
        doc.hidden = true;
        doc.dispatchEvent(new Event("visibilitychange"));
        expect(animations[0]?.cancel).toHaveBeenCalledOnce();
        dispose?.();
    });

    it("cancels immediately when reduced motion changes and never replays consumed months", () => {
        const { motion, observers, months, animations } = setup();
        const dispose = mountArchiveReveal();
        observers[0]?.emit(0);
        motion.matches = true;
        motion.dispatchEvent(new Event("change"));
        expect(animations[0]?.cancel).toHaveBeenCalledOnce();
        observers[0]?.emit(1);
        expect(months[1]?.animate).not.toHaveBeenCalled();
        motion.matches = false;
        motion.dispatchEvent(new Event("change"));
        observers[0]?.emit(0);
        observers[0]?.emit(1);
        expect(months[0]?.animate).toHaveBeenCalledOnce();
        expect(months[1]?.animate).not.toHaveBeenCalled();
        dispose?.();
    });

    it("preserves reduced-motion and print static output", () => {
        const { motion, print, observers, months, win, animations } = setup();
        motion.matches = true;
        const dispose = mountArchiveReveal();
        observers[0]?.emit(0);
        expect(months[0]?.animate).not.toHaveBeenCalled();
        motion.matches = false;
        print.matches = true;
        print.dispatchEvent(new Event("change"));
        observers[0]?.emit(1);
        expect(months[1]?.animate).not.toHaveBeenCalled();
        dispose?.();
        const disposeNext = mountArchiveReveal();
        print.matches = false;
        observers[1]?.emit(0);
        win.dispatchEvent(new Event("beforeprint"));
        expect(animations[0]?.cancel).toHaveBeenCalledOnce();
        disposeNext?.();
    });

    it("disposes animations, observer and listeners, ignoring late events", () => {
        const { observers, animations, months, doc, motion, print, win } = setup();
        const removeDoc = vi.spyOn(doc, "removeEventListener");
        const removeMotion = vi.spyOn(motion, "removeEventListener");
        const removePrint = vi.spyOn(print, "removeEventListener");
        const removeWin = vi.spyOn(win, "removeEventListener");
        const dispose = mountArchiveReveal();
        observers[0]?.emit(0);
        dispose?.();
        expect(observers[0]?.disconnect).toHaveBeenCalledOnce();
        expect(animations[0]?.cancel).toHaveBeenCalledOnce();
        animations[0]?.dispatchEvent(new Event("finish"));
        observers[0]?.emit(1);
        doc.dispatchEvent(new Event("visibilitychange"));
        expect(months[1]?.animate).not.toHaveBeenCalled();
        expect(removeDoc).toHaveBeenCalledOnce();
        expect(removeMotion).toHaveBeenCalledOnce();
        expect(removePrint).toHaveBeenCalledOnce();
        expect(removeWin).toHaveBeenCalledOnce();
    });

    it("falls back for absent months, observer or animation API", () => {
        setup(0);
        expect(mountArchiveReveal()).toBeUndefined();
        setup();
        vi.stubGlobal("IntersectionObserver", undefined);
        expect(mountArchiveReveal()).toBeUndefined();
        const { doc } = setup();
        doc.querySelectorAll.mockReturnValue([{}] as never);
        expect(mountArchiveReveal()).toBeUndefined();
    });

    it("cleans before swaps and mounts only one observer on repeated page loads", () => {
        const { doc, observers, months } = setup();
        const environment = { host: {}, target: doc, queueTask: (fn: () => void) => fn() };
        const unregister = registerPageLifecycle("archive-reveal", mountArchiveReveal, environment);
        const duplicate = registerPageLifecycle("archive-reveal", mountArchiveReveal, environment);
        expect(duplicate).toBe(unregister);
        doc.dispatchEvent(new Event("astro:page-load"));
        doc.dispatchEvent(new Event("astro:page-load"));
        expect(observers[0]?.disconnect).toHaveBeenCalledOnce();
        observers[0]?.emit(0);
        expect(months[0]?.animate).not.toHaveBeenCalled();
        observers[1]?.emit(0);
        expect(months[0]?.animate).toHaveBeenCalledOnce();
        doc.dispatchEvent(new Event("astro:before-swap"));
        expect(observers[1]?.disconnect).toHaveBeenCalledOnce();
        doc.dispatchEvent(new Event("astro:page-load"));
        observers[2]?.emit(0);
        expect(months[0]?.animate).toHaveBeenCalledTimes(2);
        unregister();
        expect(observers[2]?.disconnect).toHaveBeenCalledOnce();
    });
});
