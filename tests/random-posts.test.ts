import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("../src/scripts/page-runtime", () => ({ registerPageLifecycle: vi.fn() }));
vi.mock("../src/scripts/logger", () => ({
    createClientLogger: () => ({ debug: vi.fn(), error: vi.fn() }),
}));

import { mountRandomPosts } from "../src/scripts/random-posts";

function deferred<T>() {
    let resolve = (_: T) => {};
    let reject = (_: Error) => {};
    const promise = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
}
const settle = async () => {
    for (let tick = 0; tick < 12; tick++) await Promise.resolve();
};
let responses: ReturnType<typeof deferred<Response>>[];
let button: EventTarget;
let preference: EventTarget & { matches: boolean };
let container: {
    dataset: Record<string, string>;
    querySelector: (q: string) => unknown;
    setAttribute: ReturnType<typeof vi.fn>;
    removeAttribute: ReturnType<typeof vi.fn>;
};
let list: {
    innerHTML: string;
    style: { opacity: string };
    animate: ReturnType<typeof vi.fn>;
    getBoundingClientRect: ReturnType<typeof vi.fn>;
};
let effects: Array<{
    finished: Promise<void>;
    cancel: ReturnType<typeof vi.fn>;
    done: ReturnType<typeof deferred<void>>;
}>;
let busy: Map<string, string>;
let cleanup: (() => void) | undefined;
beforeEach(() => {
    responses = [];
    effects = [];
    busy = new Map();
    button = new EventTarget();
    preference = Object.assign(new EventTarget(), { matches: false });
    list = {
        innerHTML: "old readable articles",
        getBoundingClientRect: vi.fn(() => ({ height: 200 })),
        style: { opacity: "" },
        animate: vi.fn(() => {
            const done = deferred<void>();
            const effect = { finished: done.promise, cancel: vi.fn(), done };
            effects.push(effect);
            return effect;
        }),
    };
    container = {
        dataset: { count: "1", loadFailed: "Unable to refresh" },
        querySelector: (q: string) => (q === "#random-posts-list" ? list : button),
        setAttribute: vi.fn((name: string, value: string) => busy.set(name, value)),
        removeAttribute: vi.fn((name: string) => busy.delete(name)),
    };
    vi.stubGlobal("document", { hidden: false, querySelector: () => container });
    vi.stubGlobal("window", { innerHeight: 900, matchMedia: () => preference });
    vi.stubGlobal(
        "fetch",
        vi.fn(() => {
            const response = deferred<Response>();
            responses.push(response);
            return response.promise;
        }),
    );
});
afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.unstubAllGlobals();
});
function respond(index: number, title: string) {
    responses[index]?.resolve({
        ok: true,
        json: async () => [{ abbrlink: title, title }],
    } as Response);
}
function refresh() {
    button.dispatchEvent(new Event("click", { cancelable: true }));
}
it("starts the request immediately and keeps the old list readable with accessible busy feedback", () => {
    cleanup = mountRandomPosts();
    expect(fetch).toHaveBeenCalledOnce();
    expect(list.innerHTML).toBe("old readable articles");
    expect(list.style.opacity).toBe("");
    expect(list.animate).not.toHaveBeenCalled();
    expect(busy.get("aria-busy")).toBe("true");
});
it("aborts superseded requests and ignores old JSON responses before and after a newer completion", async () => {
    cleanup = mountRandomPosts();
    const firstSignal = vi.mocked(fetch).mock.calls[0]?.[1]?.signal as AbortSignal;
    refresh();
    expect(firstSignal.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    respond(0, "obsolete");
    await settle();
    expect(list.innerHTML).toBe("old readable articles");
    expect(busy.get("aria-busy")).toBe("true");
    respond(1, "current");
    await settle();
    expect(list.innerHTML).toContain("current");
    expect(list.innerHTML).not.toContain("obsolete");
    expect(busy.has("aria-busy")).toBe(false);
    refresh();
    refresh();
    respond(3, "latest");
    await settle();
    respond(2, "older-late");
    await settle();
    expect(list.innerHTML).toContain("latest");
    expect(list.innerHTML).not.toContain("older-late");
});
it("reveals only a completed list, settles the effect and never retains inline opacity", async () => {
    cleanup = mountRandomPosts();
    respond(0, "ready");
    await settle();
    expect(list.animate).toHaveBeenCalledWith(
        { opacity: [0.82, 1] },
        { duration: 100, easing: "ease-out" },
    );
    expect(list.style.opacity).toBe("");
    effects[0]?.done.resolve();
    await settle();
    expect(effects[0]?.cancel).toHaveBeenCalledOnce();
});
it.each(["reduced", "hidden"])("keeps final content motionless when %s", async (mode) => {
    if (mode === "reduced") preference.matches = true;
    else Object.assign(document, { hidden: true });
    cleanup = mountRandomPosts();
    respond(0, "ready");
    await settle();
    expect(list.innerHTML).toContain("ready");
    expect(list.animate).not.toHaveBeenCalled();
});
it("cleans up pending requests and does not write into a page after disposal", async () => {
    cleanup = mountRandomPosts();
    const signal = vi.mocked(fetch).mock.calls[0]?.[1]?.signal as AbortSignal;
    cleanup?.();
    cleanup = undefined;
    expect(signal.aborted).toBe(true);
    expect(busy.has("aria-busy")).toBe(false);
    respond(0, "detached");
    await settle();
    expect(list.innerHTML).toBe("old readable articles");
    expect(list.animate).not.toHaveBeenCalled();
    refresh();
    expect(fetch).toHaveBeenCalledOnce();
});
it("does not let an obsolete animation completion cancel a new refresh effect", async () => {
    cleanup = mountRandomPosts();
    respond(0, "first");
    await settle();
    refresh();
    respond(1, "second");
    await settle();
    effects[0]?.done.resolve();
    await settle();
    expect(effects[1]?.cancel).not.toHaveBeenCalled();
    preference.matches = true;
    preference.dispatchEvent(new Event("change"));
    expect(effects[1]?.cancel).toHaveBeenCalledOnce();
});
it("clears busy feedback when the current request fails", async () => {
    cleanup = mountRandomPosts();
    responses[0]?.reject(new Error("offline"));
    await settle();
    expect(list.innerHTML).toContain("Unable to refresh");
    expect(busy.has("aria-busy")).toBe(false);
    expect(list.animate).not.toHaveBeenCalled();
});

it("keeps a wrapped random list above the motion budget static and readable", async () => {
    list.getBoundingClientRect.mockReturnValue({ height: 428 });
    cleanup = mountRandomPosts();
    respond(0, "long-wrapped-title");
    await settle();
    expect(list.innerHTML).toContain("long-wrapped-title");
    expect(list.animate).not.toHaveBeenCalled();
    expect(busy.has("aria-busy")).toBe(false);
});
