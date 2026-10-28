import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { animateRouteOut } from "../src/scripts/route-out";

function node(label: string, animate: unknown, options: { inPersist?: boolean } = {}) {
    const inPersist = options.inPersist ?? false;
    return {
        label,
        isConnected: true,
        animate: animate as ReturnType<typeof vi.fn>,
        getBoundingClientRect: () => ({
            width: 1000,
            height: 800,
            top: 0,
            bottom: 800,
            left: 0,
            right: 1000,
        }),
        closest: (selector: string) =>
            selector === "[data-swup-persist]" && inPersist ? {} : null,
    };
}

function stubDocument(parts: { article?: unknown; content?: unknown[] }) {
    const main = {
        isConnected: true,
        getBoundingClientRect: () => ({
            width: 1000,
            height: 800,
            top: 0,
            bottom: 800,
            left: 0,
            right: 1000,
        }),
        querySelector: (selector: string) =>
            selector === "article.stalux-article" ? (parts.article ?? null) : null,
        querySelectorAll: () => parts.content ?? [],
    };
    vi.stubGlobal("document", {
        hidden: false,
        querySelector: (selector: string) => (selector === "main[data-stalux-route]" ? main : null),
    });
}

beforeEach(() => {
    vi.stubGlobal("window", {
        innerWidth: 1440,
        innerHeight: 900,
        matchMedia: () => ({ matches: false }),
    });
});
afterEach(() => vi.unstubAllGlobals());

it("moves the article column out and holds the fill until released", async () => {
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel }));
    stubDocument({ article: node("article.stalux-article", animate) });
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");
    const release = await animateRouteOut("enter", controller.signal);
    expect(animate).toHaveBeenCalledWith(
        { opacity: [1, 0], transform: ["translate3d(0, 0, 0)", "translate3d(0, -40px, 0)"] },
        expect.objectContaining({ fill: "forwards" }),
    );
    // The fill outlives the cue so the swapped document cannot flash at opacity 1.
    expect(cancel).not.toHaveBeenCalled();
    release();
    expect(cancel).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
});

it("fades the article column out in place, with no lateral travel", async () => {
    for (const preset of ["next", "previous", "article"] as const) {
        const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn() }));
        stubDocument({ article: node("article", animate) });
        const release = await animateRouteOut(preset, new AbortController().signal);
        // The shell is kept, so only the column's opacity changes: a translate
        // would make a very tall column look like it jerked sideways.
        expect(animate).toHaveBeenCalledWith({ opacity: [1, 0] }, expect.anything());
        expect(animate.mock.calls[0]?.[0]).not.toHaveProperty("transform");
        release();
    }
});

it("aborts a pending outgoing effect and restores the old cue", async () => {
    let reject = (_: Error) => {};
    const finished = new Promise<void>((_, fail) => {
        reject = fail;
    });
    const cancel = vi.fn(() => reject(new Error("aborted")));
    const controller = new AbortController();
    stubDocument({ article: node("article", () => ({ finished, cancel })) });
    const result = animateRouteOut("enter", controller.signal);
    controller.abort();
    const release = await result;
    release();
    expect(cancel).toHaveBeenCalled();
});

it("does nothing for a preset without motion or a missing stage", async () => {
    const animate = vi.fn();
    stubDocument({ article: null });
    await animateRouteOut("none", new AbortController().signal);
    await animateRouteOut("enter", new AbortController().signal);
    expect(animate).not.toHaveBeenCalled();
});

it("never animates a persisted sidebar", async () => {
    const sidebar = node("aside.stalux-sidebar", vi.fn(), { inPersist: true });
    stubDocument({ content: [sidebar], article: null });
    await animateRouteOut("enter", new AbortController().signal);
    expect(sidebar.animate).not.toHaveBeenCalled();
});

it("keeps the authored frame when motion is reduced or the tab is hidden", async () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn() }));
    vi.stubGlobal("document", { hidden: true, querySelector: () => null });
    await animateRouteOut("enter", new AbortController().signal);
    expect(animate).not.toHaveBeenCalled();
    vi.stubGlobal("window", {
        innerWidth: 1440,
        innerHeight: 900,
        matchMedia: () => ({ matches: true }),
    });
    stubDocument({ article: node("article", animate) });
    await animateRouteOut("enter", new AbortController().signal);
    expect(animate).not.toHaveBeenCalled();
});
