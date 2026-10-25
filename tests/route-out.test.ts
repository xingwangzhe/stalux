import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { animateRouteOut } from "../src/scripts/route-out";

const geometry = {
    isConnected: true,
    hasAttribute: () => true,
    getBoundingClientRect: () => ({
        width: 500,
        height: 100,
        top: 50,
        bottom: 150,
        left: 20,
        right: 520,
    }),
};
beforeEach(() => {
    vi.stubGlobal("document", { hidden: false });
    vi.stubGlobal("window", {
        innerWidth: 1440,
        innerHeight: 900,
        matchMedia: () => ({ matches: false }),
    });
});
afterEach(() => vi.unstubAllGlobals());
it("holds only a bounded outgoing cue until replacement then releases it", async () => {
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel }));
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");
    const release = await animateRouteOut(
        { ...geometry, animate } as unknown as HTMLElement,
        controller.signal,
    );
    expect(animate).toHaveBeenCalledWith(
        expect.objectContaining({ opacity: [1, 0.82] }),
        expect.objectContaining({ duration: 80 }),
    );
    expect(cancel).not.toHaveBeenCalled();
    release();
    expect(cancel).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
});
it("aborts a pending outgoing effect and restores the old cue", async () => {
    let reject = (_: Error) => {};
    const finished = new Promise<void>((_, fail) => {
        reject = fail;
    });
    const cancel = vi.fn(() => reject(new Error("aborted")));
    const controller = new AbortController();
    const result = animateRouteOut(
        { ...geometry, animate: () => ({ finished, cancel }) } as unknown as HTMLElement,
        controller.signal,
    );
    controller.abort();
    const release = await result;
    release();
    expect(cancel).toHaveBeenCalled();
});
it("does not animate a main or a long document", async () => {
    const animate = vi.fn();
    await animateRouteOut(
        { ...geometry, hasAttribute: () => false, animate } as unknown as HTMLElement,
        new AbortController().signal,
    );
    expect(animate).not.toHaveBeenCalled();
});
