// @vitest-environment happy-dom

/**
 * Real-DOM checks for the unroll cue.
 *
 * The rest of the suite drives `list-reveal` through hand-built stubs, which
 * cannot answer questions like "does this selector actually match" or "is the
 * thing the observer hands back a real element". happy-dom gives a real
 * document, real elements and a real Web Animations implementation, so this file
 * exercises the module the way a browser would: build markup, mount, deliver an
 * observer entry, then look at the animations that exist on the actual rows.
 *
 * It also pins the reason the module types its targets as `Element`: the target
 * the observer delivers IS an HTMLElement, so no assertion is needed anywhere.
 */

import { afterEach, beforeAll, expect, it, vi } from "vitest";
import type { mountListReveal } from "../src/scripts/list-reveal";

type ListRevealModule = {
    mountListReveal: typeof mountListReveal;
    primeListReveal: () => void;
};

let module: ListRevealModule;
let deliver: IntersectionObserverCallback;
let observed: Element[];

class ManualObserver {
    constructor(callback: IntersectionObserverCallback) {
        deliver = callback;
    }
    observe(target: Element): void {
        observed.push(target);
    }
    unobserve(): void {}
    disconnect(): void {}
}

/** One group with `rows` real rows, laid out at `top` in the viewport. */
function buildGroup(rows: number, top = 100): Element {
    const group = document.createElement("ul");
    group.setAttribute("data-stalux-reveal", "");
    for (let index = 0; index < rows; index += 1) {
        const row = document.createElement("li");
        row.setAttribute("data-stalux-reveal-item", "");
        row.textContent = `row ${index}`;
        // happy-dom has no layout engine, so give the group and rows a box the
        // module's near-viewport test can reason about. A real DOMRect keeps the
        // stub honest (top/bottom are derived, not hand-written).
        row.getBoundingClientRect = () => new DOMRect(0, top, 800, 40);
        group.append(row);
    }
    group.getBoundingClientRect = () => new DOMRect(0, top, 800, rows * 40);
    document.body.append(group);
    return group;
}

function animationsOn(element: Element): Animation[] {
    return element.getAnimations();
}

beforeAll(async () => {
    // The observer is replaced before the module mounts so this file decides when
    // entries are delivered; everything else is happy-dom's real implementation.
    vi.stubGlobal("IntersectionObserver", ManualObserver);
    module = (await import("../src/scripts/list-reveal")) as ListRevealModule;
});

afterEach(() => {
    deliver = undefined as unknown as IntersectionObserverCallback;
    observed = [];
    document.body.innerHTML = "";
    delete document.documentElement.dataset.staluxVtPreset;
});

it("matches real markup and holds every row on the wipe's first frame", () => {
    observed = [];
    const group = buildGroup(3);

    // Reached through the router's own event, not by calling prime() directly.
    document.dispatchEvent(new Event("astro:after-swap"));

    const rows = [...group.children];
    expect(rows).toHaveLength(3);
    // The selector matched real elements, and what it matched is an HTMLElement.
    expect(rows[0]).toBeInstanceOf(HTMLElement);
    for (const row of rows) {
        const [animation] = animationsOn(row);
        expect(animation).toBeDefined();
        expect(animation?.playState).toBe("paused");
        const effect = animation?.effect as KeyframeEffect;
        expect(effect.getTiming().delay).toBe(0);
        // The paused frame is the start of the wipe, not the finished row.
        const [first] = effect.getKeyframes();
        expect(String(first?.clipPath)).toContain("100%");
        expect(Number(first?.opacity)).toBeLessThan(1);
    }
});

it("starts the wipe from that same frame once the group is in view", () => {
    observed = [];
    const group = buildGroup(3);
    document.dispatchEvent(new Event("astro:after-swap"));
    const rows = [...group.children];

    const dispose = module.mountListReveal();
    expect(observed).toEqual([group]);

    // Deliver the entry the way the browser would: the target is the real group.
    const entry = {
        target: group,
        isIntersecting: true,
        boundingClientRect: group.getBoundingClientRect(),
    } as unknown as IntersectionObserverEntry;
    expect(entry.target).toBeInstanceOf(HTMLElement);
    deliver([entry], {} as IntersectionObserver);

    rows.forEach((row, index) => {
        const [animation] = animationsOn(row);
        if (!animation) throw new Error(`row ${index} has no animation`);
        expect(animation.playState).toBe("running");
        // The stagger counts from the moment the group is on screen.
        const effect = animation.effect;
        if (!(effect instanceof KeyframeEffect)) throw new Error("expected a keyframe effect");
        expect(effect.getTiming().delay).toBe(index * 22);
    });
    dispose?.();
});

it("leaves an off-screen group alone and keeps it readable", () => {
    observed = [];
    const far = buildGroup(2, 32_000);
    document.dispatchEvent(new Event("astro:after-swap"));

    // Holding a group nobody can see would only add paused effects to the swap
    // frame; it starts its own wipe when it scrolls in instead.
    for (const row of far.children) expect(animationsOn(row)).toHaveLength(0);
});

it("does nothing at all under reduced motion", () => {
    observed = [];
    const group = buildGroup(2);
    const matchMedia = vi
        .spyOn(window, "matchMedia")
        .mockReturnValue({ matches: true } as MediaQueryList);
    try {
        expect(module.mountListReveal()).toBeUndefined();
        for (const row of group.children) expect(animationsOn(row)).toHaveLength(0);
    } finally {
        matchMedia.mockRestore();
    }
});
