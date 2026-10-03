import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerPageLifecycle } from "../src/scripts/page-runtime";
import { createTypewriter, mountTypewriters, normalizeMessages } from "../src/scripts/typewriter";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

function engine(messages = ["AB", "C"]) {
    const render = vi.fn();
    const controller = createTypewriter(messages, render);
    const frame = () => render.mock.lastCall?.[0];
    return { controller, render, frame };
}

describe("typewriter state machine", () => {
    it("types, holds, deletes, waits and loops in configuration order", () => {
        const { controller, frame } = engine();
        controller.setActive(true);
        expect(frame()).toEqual({ text: "", state: "typing" });
        vi.advanceTimersByTime(100);
        expect(frame()?.text).toBe("A");
        vi.advanceTimersByTime(100);
        expect(frame()).toEqual({ text: "AB", state: "holding" });
        vi.advanceTimersByTime(1499);
        expect(frame()?.text).toBe("AB");
        vi.advanceTimersByTime(1);
        expect(frame()).toEqual({ text: "A", state: "deleting" });
        vi.advanceTimersByTime(33);
        expect(frame()).toEqual({ text: "", state: "waiting" });
        vi.advanceTimersByTime(500);
        expect(frame()).toEqual({ text: "C", state: "holding" });
        vi.advanceTimersByTime(1500 + 500);
        expect(frame()?.text).toBe("A");
        expect(vi.getTimerCount()).toBe(1);
        controller.dispose();
    });

    it("loops a single message", () => {
        const { controller, frame } = engine(["X"]);
        controller.setActive(true);
        vi.advanceTimersByTime(100 + 1500 + 500);
        expect(frame()).toEqual({ text: "X", state: "holding" });
        controller.dispose();
    });

    it.each([{ messages: [] }, { messages: ["", ""] }])(
        "does not schedule empty messages $messages",
        ({ messages }) => {
            const { controller, render } = engine(messages);
            controller.setActive(true);
            controller.setReducedMotion(true);
            expect(render).not.toHaveBeenCalled();
            expect(vi.getTimerCount()).toBe(0);
            controller.dispose();
        },
    );

    it("skips empty entries and rejects malformed message values", () => {
        expect(normalizeMessages(null)).toEqual([]);
        expect(normalizeMessages(["", 1, "中", " "])).toEqual(["中", " "]);
        const { controller, frame } = engine(["", "中", ""]);
        controller.setActive(true);
        vi.advanceTimersByTime(100);
        expect(frame()?.text).toBe("中");
        controller.dispose();
    });

    it("types whole graphemes including emoji and combining marks", () => {
        const { controller, frame } = engine(["中👨‍👩‍👧‍👦e\u0301"]);
        controller.setActive(true);
        vi.advanceTimersByTime(200);
        expect(frame()?.text).toBe("中👨‍👩‍👧‍👦");
        vi.advanceTimersByTime(100);
        expect(frame()).toEqual({ text: "中👨‍👩‍👧‍👦e\u0301", state: "holding" });
        controller.dispose();
    });

    it("falls back to code points without Intl.Segmenter", () => {
        vi.stubGlobal("Intl", { Segmenter: undefined });
        const { controller, frame } = engine(["中😀"]);
        controller.setActive(true);
        vi.advanceTimersByTime(200);
        expect(frame()?.text).toBe("中😀");
        controller.dispose();
    });

    it.each([100, 200, 1700, 1733])(
        "resumes its current phase after pausing at %i ms",
        (elapsed) => {
            const { controller, frame } = engine();
            controller.setActive(true);
            vi.advanceTimersByTime(elapsed);
            const text = frame()?.text;
            controller.setActive(false);
            expect(frame()?.state).toBe("paused");
            expect(vi.getTimerCount()).toBe(0);
            vi.advanceTimersByTime(10000);
            expect(frame()?.text).toBe(text);
            controller.setActive(true);
            const state = frame()?.state;
            const delay = { typing: 100, holding: 1500, deleting: 33, waiting: 500 }[
                state as "typing"
            ];
            vi.advanceTimersByTime(delay - 1);
            expect(frame()?.text).toBe(text);
            vi.advanceTimersByTime(1);
            expect(frame()?.text).not.toBe(text);
            controller.dispose();
        },
    );

    it("immediately switches to whole messages and restarts the current sentence on motion changes", () => {
        const { controller, frame } = engine();
        controller.setActive(true);
        vi.advanceTimersByTime(100);
        controller.setReducedMotion(true);
        expect(frame()).toEqual({ text: "AB", state: "reduced" });
        vi.advanceTimersByTime(2199);
        expect(frame()?.text).toBe("AB");
        vi.advanceTimersByTime(1);
        expect(frame()?.text).toBe("C");
        controller.setActive(false);
        expect(vi.getTimerCount()).toBe(0);
        vi.advanceTimersByTime(10000);
        expect(frame()?.text).toBe("C");
        controller.setReducedMotion(false);
        expect(frame()).toEqual({ text: "", state: "paused" });
        controller.setActive(true);
        vi.advanceTimersByTime(100);
        expect(frame()?.text).toBe("C");
        controller.dispose();
    });

    it("does not duplicate timers and cannot restart after disposal", () => {
        const { controller, render } = engine();
        controller.setActive(true);
        controller.setActive(true);
        controller.setReducedMotion(false);
        expect(vi.getTimerCount()).toBe(1);
        controller.dispose();
        const calls = render.mock.calls.length;
        controller.setActive(true);
        controller.setReducedMotion(true);
        vi.advanceTimersByTime(10000);
        expect(render).toHaveBeenCalledTimes(calls);
        expect(vi.getTimerCount()).toBe(0);
    });
});

function browser(messages: unknown[] = [["AB", "C"]], reduced = false) {
    const outputs = messages.map(() => ({ textContent: "static first sentence" }));
    const elements = messages.map((value, index) => ({
        dataset: {
            messages: typeof value === "string" ? value : JSON.stringify(value),
            typewriterState: "",
        },
        querySelector: vi.fn(() => outputs[index]),
    }));
    const doc = Object.assign(new EventTarget(), {
        hidden: false,
        querySelectorAll: vi.fn(() => elements),
    });
    const media = Object.assign(new EventTarget(), { matches: reduced });
    const observers: Array<{
        callback: IntersectionObserverCallback;
        disconnect: ReturnType<typeof vi.fn>;
    }> = [];
    vi.stubGlobal("document", doc);
    vi.stubGlobal("window", { matchMedia: () => media });
    vi.stubGlobal(
        "IntersectionObserver",
        class {
            disconnect = vi.fn();
            constructor(callback: IntersectionObserverCallback) {
                observers.push({ callback, disconnect: this.disconnect });
            }
            observe() {}
        },
    );
    const visible = (index: number, value: boolean) =>
        observers[index]?.callback(
            [{ isIntersecting: value } as IntersectionObserverEntry],
            {} as IntersectionObserver,
        );
    return { doc, media, outputs, elements, observers, visible };
}

describe("typewriter page integration", () => {
    it("keeps static text until visible, pauses in the background, and cleans all listeners", () => {
        const { doc, media, outputs, elements, observers, visible } = browser();
        const dispose = mountTypewriters();
        expect(outputs[0]?.textContent).toBe("static first sentence");
        expect(vi.getTimerCount()).toBe(0);
        visible(0, true);
        vi.advanceTimersByTime(100);
        expect(outputs[0]?.textContent).toBe("A");
        doc.hidden = true;
        doc.dispatchEvent(new Event("visibilitychange"));
        expect(vi.getTimerCount()).toBe(0);
        vi.advanceTimersByTime(10000);
        expect(outputs[0]?.textContent).toBe("A");
        doc.hidden = false;
        doc.dispatchEvent(new Event("visibilitychange"));
        vi.advanceTimersByTime(100);
        expect(outputs[0]?.textContent).toBe("AB");
        visible(0, false);
        expect(vi.getTimerCount()).toBe(0);
        media.matches = true;
        media.dispatchEvent(new Event("change"));
        expect(elements[0]?.dataset.typewriterState).toBe("reduced");
        dispose();
        expect(observers[0]?.disconnect).toHaveBeenCalledOnce();
        doc.dispatchEvent(new Event("visibilitychange"));
        media.matches = false;
        media.dispatchEvent(new Event("change"));
        expect(vi.getTimerCount()).toBe(0);
    });

    it("mounts initial reduced motion and independent instances", () => {
        const { outputs, visible } = browser([["AB"], ["XY"]], true);
        const dispose = mountTypewriters();
        expect(outputs.map((output) => output.textContent)).toEqual(["AB", "XY"]);
        visible(0, true);
        visible(1, true);
        expect(vi.getTimerCount()).toBe(2);
        visible(0, false);
        expect(vi.getTimerCount()).toBe(1);
        dispose();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("ignores missing outputs, empty lists and invalid data", () => {
        const { elements, observers } = browser([[], "{invalid", { invalid: true }, [""]]);
        elements[0]?.querySelector.mockReturnValue(undefined);
        const dispose = mountTypewriters();
        expect(observers).toHaveLength(0);
        expect(vi.getTimerCount()).toBe(0);
        dispose();
    });

    it("disposes old DOM and binds once after soft navigation and repeated page loads", () => {
        const { doc, outputs, elements, observers, visible } = browser();
        const unregister = registerPageLifecycle("typewriter-test", mountTypewriters, {
            host: {},
            target: doc,
            queueTask: (callback) => callback(),
        });
        doc.dispatchEvent(new Event("astro:page-load"));
        visible(0, true);
        vi.advanceTimersByTime(100);
        const oldText = outputs[0]?.textContent;
        doc.dispatchEvent(new Event("astro:before-swap"));
        expect(vi.getTimerCount()).toBe(0);
        doc.querySelectorAll.mockReturnValue([]);
        doc.dispatchEvent(new Event("astro:page-load"));
        doc.querySelectorAll.mockReturnValue(elements);
        doc.dispatchEvent(new Event("astro:page-load"));
        doc.dispatchEvent(new Event("astro:page-load"));
        expect(observers[0]?.disconnect).toHaveBeenCalledOnce();
        expect(observers[1]?.disconnect).toHaveBeenCalledOnce();
        visible(2, true);
        expect(vi.getTimerCount()).toBe(1);
        vi.advanceTimersByTime(100);
        expect(outputs[0]?.textContent).toBe(oldText);
        unregister();
        expect(vi.getTimerCount()).toBe(0);
        expect(observers[2]?.disconnect).toHaveBeenCalledOnce();
    });
});
