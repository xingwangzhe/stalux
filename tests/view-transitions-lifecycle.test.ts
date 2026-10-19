import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/scripts/navigation-font", () => ({ prepareNavigationFont: vi.fn() }));
vi.mock("../src/scripts/navigation-progress", () => ({ installNavigationProgress: vi.fn() }));
const root = () => ({ dataset: {} as Record<string, string> });
let documentMock: EventTarget & { documentElement: ReturnType<typeof root> };
function fire(type: string, values = {}) {
    documentMock.dispatchEvent(Object.assign(new Event(type), values));
}
function navigation() {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => {
        finish = resolve;
    });
    return {
        from: new URL("https://example.com/posts/one/"),
        to: new URL("https://example.com/posts/two/"),
        direction: "forward",
        signal: new AbortController().signal,
        loader: async () => {},
        newDocument: { documentElement: root(), querySelectorAll: () => [] },
        viewTransition: { finished },
        finish,
    };
}
beforeEach(async () => {
    vi.resetModules();
    documentMock = Object.assign(new EventTarget(), {
        documentElement: root(),
        querySelector: () => null,
        querySelectorAll: () => [],
    });
    vi.stubGlobal("document", documentMock);
    vi.stubGlobal("window", { location: new URL("https://example.com/posts/one/") });
    await import("../src/scripts/view-transitions");
});
afterEach(() => vi.unstubAllGlobals());
describe("route motion state across Astro root swaps", () => {
    it("survives the root swap and page-load until the animation finishes", async () => {
        const nav = navigation();
        fire("astro:before-preparation", nav);
        fire("astro:before-swap", nav);
        expect(nav.newDocument.documentElement.dataset.staluxVtFrom).toBe("article");
        documentMock.documentElement = nav.newDocument.documentElement;
        fire("astro:after-swap");
        fire("astro:page-load");
        expect(documentMock.documentElement.dataset.staluxVtTo).toBe("article");
        nav.finish();
        await Promise.resolve();
        expect(documentMock.documentElement.dataset.staluxVtFrom).toBeUndefined();
    });
    it("does not let an obsolete animation clear the next navigation's state", async () => {
        const first = navigation();
        fire("astro:before-preparation", first);
        fire("astro:before-swap", first);
        const second = navigation();
        second.to = new URL("https://example.com/archives/");
        fire("astro:before-preparation", second);
        first.finish();
        await Promise.resolve();
        expect(documentMock.documentElement.dataset.staluxVtTo).toBe("archive");
    });
});
