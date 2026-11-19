// @vitest-environment happy-dom

import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mountListReveal } from "../src/scripts/list-reveal";

let deliver: IntersectionObserverCallback;
let preference: { matches: boolean };
const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    preference = { matches: false };
    vi.stubGlobal(
        "IntersectionObserver",
        class {
            constructor(callback: IntersectionObserverCallback) {
                deliver = callback;
            }
            observe = observe;
            unobserve = unobserve;
            disconnect = disconnect;
        },
    );
    vi.spyOn(window, "matchMedia").mockImplementation(() => preference as MediaQueryList);
    vi.spyOn(document, "hidden", "get").mockReturnValue(false);
});

afterEach(() => {
    document.body.replaceChildren();
    delete document.documentElement.dataset.staluxVtPreset;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

function group(count: number): HTMLUListElement {
    const list = document.createElement("ul");
    list.setAttribute("data-stalux-reveal", "");
    for (let index = 0; index < count; index++) {
        const row = document.createElement("li");
        row.setAttribute("data-stalux-reveal-item", "");
        list.append(row);
    }
    document.body.append(list);
    return list;
}

function enter(target: Element, isIntersecting = true) {
    deliver([{ target, isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
}

it("sets bounded CSS delays only when a real group enters and cleans up after swap", () => {
    const list = group(20);
    const dispose = mountListReveal();
    expect(observe).toHaveBeenCalledWith(list);
    enter(list, false);
    expect(list.querySelector("[data-stalux-revealing]")).toBeNull();
    enter(list);
    expect(unobserve).toHaveBeenCalledWith(list);
    expect(list.querySelectorAll("[data-stalux-revealing]")).toHaveLength(16);
    expect(list.children[1]?.getAttribute("style")).toContain("22ms");
    expect(list.children[15]?.getAttribute("style")).toContain("200ms");
    dispose?.();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(list.querySelector("[data-stalux-revealing]")).toBeNull();
});

it("leaves rows in the route cue visible and still animates later groups", () => {
    const aboveFold = group(2);
    const belowFold = group(2);
    document.documentElement.dataset.staluxVtPreset = "paper";
    mountListReveal();
    enter(aboveFold);
    expect(aboveFold.querySelector("[data-stalux-revealing]")).toBeNull();
    delete document.documentElement.dataset.staluxVtPreset;
    enter(belowFold);
    expect(belowFold.querySelectorAll("[data-stalux-revealing]")).toHaveLength(2);
});

it("skips retained content, restores and reduced motion", () => {
    const list = group(2);
    list.setAttribute("data-swup-persist", "");
    expect(mountListReveal()).toBeUndefined();
    list.setAttribute("data-stalux-shell-fresh", "");
    document.documentElement.dataset.staluxVtPreset = "restore";
    expect(mountListReveal()).toBeUndefined();
    delete document.documentElement.dataset.staluxVtPreset;
    preference.matches = true;
    expect(mountListReveal()).toBeUndefined();
    expect(observe).not.toHaveBeenCalled();
});
