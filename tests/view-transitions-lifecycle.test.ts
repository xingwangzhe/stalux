import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/scripts/navigation-font", () => ({ prepareNavigationFont: vi.fn() }));
const root = () => {
    const properties = new Map<string, string>();
    return {
        dataset: {} as Record<string, string>,
        style: {
            getPropertyValue: (property: string) => properties.get(property) ?? "",
            setProperty: (property: string, value: string) => properties.set(property, value),
        },
    };
};
let documentMock: EventTarget & {
    documentElement: ReturnType<typeof root>;
    querySelector: (selector: string) => unknown;
};
function fire(type: string, values = {}) {
    documentMock.dispatchEvent(Object.assign(new Event(type), values));
}
async function settle() {
    for (let tick = 0; tick < 8; tick++) await Promise.resolve();
}
function navigation() {
    let finish!: () => void;
    const ready = Promise.resolve();
    const finished = new Promise<void>((resolve) => {
        finish = resolve;
    });
    return {
        from: new URL("https://example.com/posts/one/"),
        to: new URL("https://example.com/posts/two/"),
        direction: "forward",
        navigationType: "push",
        signal: new AbortController().signal,
        loader: async () => {},
        newDocument: {
            documentElement: root(),
            querySelector: (_selector: string): unknown => null,
            querySelectorAll: () => [],
        },
        viewTransition: { ready, finished },
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
    vi.stubGlobal(
        "window",
        Object.assign(new EventTarget(), {
            location: new URL("https://example.com/posts/one/"),
        }),
    );
    await import("../src/scripts/view-transitions");
});
afterEach(() => vi.unstubAllGlobals());
describe("route motion state across Astro root swaps", () => {
    it("does not rewrite server-rendered route attributes on after-swap and page-load", () => {
        const writes = vi.fn();
        documentMock.documentElement.dataset = new Proxy(
            { staluxRoute: "article" },
            {
                set: (target, property, value) => {
                    writes(property, value);
                    Reflect.set(target, property, value);
                    return true;
                },
            },
        );
        const main = {
            getAttribute: () => "article",
            setAttribute: vi.fn(),
        };
        documentMock.querySelector = () => main;
        fire("astro:after-swap");
        fire("astro:page-load");
        expect(writes).not.toHaveBeenCalled();
        expect(main.setAttribute).not.toHaveBeenCalled();
    });

    it("survives the root swap and page-load until the native transition finishes", async () => {
        const nav = navigation();
        fire("astro:before-preparation", nav);
        fire("astro:before-swap", nav);
        expect(nav.newDocument.documentElement.dataset.staluxVtFrom).toBe("article");
        documentMock.documentElement = nav.newDocument.documentElement;
        fire("astro:after-swap");
        fire("astro:page-load");
        expect(documentMock.documentElement.dataset.staluxVtTo).toBe("article");
        nav.finish();
        await settle();
        expect(documentMock.documentElement.dataset.staluxVtFrom).toBeUndefined();
    });
    it("does not let an obsolete navigation clear the next one's state", async () => {
        const first = navigation();
        fire("astro:before-preparation", first);
        fire("astro:before-swap", first);
        const second = navigation();
        second.to = new URL("https://example.com/archives/");
        fire("astro:before-preparation", second);
        first.finish();
        await settle();
        expect(documentMock.documentElement.dataset.staluxVtTo).toBe("archive");
    });

    it("carries measured header dimensions only between matching persistent shells", () => {
        const nav = navigation();
        documentMock.querySelector = () => ({});
        nav.newDocument.querySelector = () => ({});
        documentMock.documentElement.style.setProperty("--stalux-nav-offset", "80px");
        documentMock.documentElement.style.setProperty("--stalux-site-header-height", "64px");
        documentMock.documentElement.style.setProperty("--unrelated", "old");
        nav.newDocument.documentElement.style.setProperty("--stalux-nav-offset", "90px");
        fire("astro:before-swap", nav);
        expect(
            nav.newDocument.documentElement.style.getPropertyValue("--stalux-site-header-height"),
        ).toBe("64px");
        expect(nav.newDocument.documentElement.style.getPropertyValue("--stalux-nav-offset")).toBe(
            "90px",
        );
        expect(nav.newDocument.documentElement.style.getPropertyValue("--unrelated")).toBe("");
    });

    it("does not carry header metrics into a page without the persistent header", () => {
        const nav = navigation();
        documentMock.querySelector = () => ({});
        documentMock.documentElement.style.setProperty("--stalux-site-header-height", "64px");
        fire("astro:before-swap", nav);
        expect(
            nav.newDocument.documentElement.style.getPropertyValue("--stalux-site-header-height"),
        ).toBe("");
    });

    it("aborts on an already-aborted navigation and skips state + header preservation", () => {
        const nav = navigation();
        nav.signal = new AbortController().signal;
        Object.defineProperty(nav.signal, "aborted", { value: true, configurable: true });
        documentMock.querySelector = () => ({ getPropertyValue: () => "" });
        fire("astro:before-swap", nav);
        expect(nav.newDocument.documentElement.dataset.staluxVtFrom).toBeUndefined();
        expect(nav.newDocument.documentElement.dataset.staluxVtTo).toBeUndefined();
        expect(
            nav.newDocument.documentElement.style.getPropertyValue("--stalux-site-header-height"),
        ).toBe("");
    });

    it("allows CSS ::view-transition-old/new to pick direction from data-stalux-vt-direction", () => {
        const nav = navigation();
        nav.direction = "backward";
        fire("astro:before-preparation", nav);
        fire("astro:before-swap", nav);
        expect(nav.newDocument.documentElement.dataset.staluxVtDirection).toBe("backward");
    });
});
