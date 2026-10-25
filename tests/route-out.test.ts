import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { animateRouteOut } from "../src/scripts/route-out";

beforeEach(() => {
    vi.stubGlobal("document", { hidden: false });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
});
afterEach(() => vi.unstubAllGlobals());
it("holds the outgoing frame until replacement and then releases it", async () => {
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel }));
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");
    const release = await animateRouteOut({ animate } as unknown as HTMLElement, controller.signal);
    expect(cancel).not.toHaveBeenCalled();
    release();
    expect(cancel).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
});
it("aborts a pending outgoing effect and restores the old page", async () => {
    let reject = (_: Error) => {};
    const finished = new Promise<void>((_, fail) => {
        reject = fail;
    });
    const cancel = vi.fn(() => reject(new Error("aborted")));
    const controller = new AbortController();
    const result = animateRouteOut(
        { animate: () => ({ finished, cancel }) } as unknown as HTMLElement,
        controller.signal,
    );
    controller.abort();
    const release = await result;
    release();
    expect(cancel).toHaveBeenCalled();
});
