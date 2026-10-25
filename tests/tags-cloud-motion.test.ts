import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("../src/scripts/page-runtime", () => ({ registerPageLifecycle: vi.fn() }));
const state = vi.hoisted(() => ({ create: vi.fn(), destroy: vi.fn() }));
vi.mock("@xingwangzhe/tags-cloud", () => ({
    TagCloud: class {
        constructor() {
            state.create();
        }
        destroy = state.destroy;
    },
}));

import { mountTagsCloud } from "../src/scripts/tags-cloud";

let onVisibility: IntersectionObserverCallback;
let reduced: EventTarget & { matches: boolean };
let desktop: EventTarget & { matches: boolean };
beforeEach(() => {
    state.create.mockClear();
    state.destroy.mockClear();
    reduced = Object.assign(new EventTarget(), { matches: false });
    desktop = Object.assign(new EventTarget(), { matches: true });
    vi.stubGlobal("window", {
        matchMedia: (q: string) => (q.includes("reduced") ? reduced : desktop),
        innerWidth: 1440,
    });
    vi.stubGlobal(
        "document",
        Object.assign(new EventTarget(), {
            hidden: false,
            getElementById: () => ({
                clientWidth: 900,
                dataset: {
                    tags: JSON.stringify([{ type: "link", text: "test", url: "/tags/test/" }]),
                },
            }),
        }),
    );
    vi.stubGlobal(
        "IntersectionObserver",
        class {
            constructor(cb: IntersectionObserverCallback) {
                onVisibility = cb;
            }
            observe() {}
            disconnect() {}
        },
    );
});
afterEach(() => vi.unstubAllGlobals());
async function visible() {
    onVisibility(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
    );
    await vi.dynamicImportSettled();
}
it("uses the static SSR tag list rather than a rotating Canvas in reduced motion", async () => {
    reduced.matches = true;
    const cleanup = mountTagsCloud();
    await visible();
    expect(state.create).not.toHaveBeenCalled();
    cleanup?.();
});
it("destroys a live cloud when reduced motion becomes active", async () => {
    const cleanup = mountTagsCloud();
    await visible();
    expect(state.create).toHaveBeenCalledOnce();
    reduced.matches = true;
    reduced.dispatchEvent(new Event("change"));
    expect(state.destroy).toHaveBeenCalledOnce();
    cleanup?.();
});
