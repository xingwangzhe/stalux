import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("../src/scripts/page-runtime", () => ({ registerPageLifecycle: vi.fn() }));

import { mountModuleMotion } from "../src/scripts/module-motion";

let callback: IntersectionObserverCallback;
let preference: EventTarget & { matches: boolean };
let elements: HTMLElement[];
let observer: {
    observe: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
};
let changing: boolean;
beforeEach(() => {
    preference = Object.assign(new EventTarget(), { matches: false });
    changing = false;
    elements = Array.from(
        { length: 15 },
        () =>
            ({
                closest: () => null,
                setAttribute: vi.fn(),
                removeAttribute: vi.fn(),
            }) as unknown as HTMLElement,
    );
    observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    vi.stubGlobal(
        "IntersectionObserver",
        class {
            constructor(cb: IntersectionObserverCallback) {
                callback = cb;
            }
            observe = observer.observe;
            unobserve = observer.unobserve;
            disconnect = observer.disconnect;
        },
    );
    vi.stubGlobal("window", { innerHeight: 900, matchMedia: () => preference });
    vi.stubGlobal("document", {
        hidden: false,
        querySelectorAll: () => elements,
        documentElement: { dataset: {}, classList: { contains: () => changing } },
    });
});
afterEach(() => vi.unstubAllGlobals());
function enter(index = 0, height = 180) {
    callback(
        [
            { target: elements[index], isIntersecting: true, boundingClientRect: { height } },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
    );
}
it("bounds observation and releases each visible region immediately", () => {
    const cleanup = mountModuleMotion();
    expect(observer.observe).toHaveBeenCalledTimes(12);
    enter();
    expect(observer.unobserve).toHaveBeenCalledWith(elements[0]);
    expect(elements[0]?.setAttribute).toHaveBeenCalledWith("data-stalux-module-entering", "");
    cleanup?.();
    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(elements[0]?.removeAttribute).toHaveBeenCalledWith("data-stalux-module-entering");
});
it("does not stack module cues over route motion, oversized content or lead regions", () => {
    mountModuleMotion();
    changing = true;
    enter();
    changing = false;
    enter(1, 9000);
    const lead = elements[2];
    if (!lead) throw new Error("Missing fixture");
    Object.assign(lead, { closest: () => ({}) });
    enter(2);
    expect(elements[0]?.setAttribute).not.toHaveBeenCalled();
    expect(elements[1]?.setAttribute).not.toHaveBeenCalled();
    expect(elements[2]?.setAttribute).not.toHaveBeenCalled();
});
it("does not set up effects for reduced motion", () => {
    preference.matches = true;
    expect(mountModuleMotion()).toBeUndefined();
    expect(observer.observe).not.toHaveBeenCalled();
});
it("cancels running effects when the user changes motion preference", () => {
    const cleanup = mountModuleMotion();
    enter();
    preference.matches = true;
    preference.dispatchEvent(new Event("change"));
    expect(elements[0]?.removeAttribute).toHaveBeenCalledWith("data-stalux-module-entering");
    cleanup?.();
});
