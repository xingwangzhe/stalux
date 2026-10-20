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
    it.each([
        [{}, true],
        [{ ctrlKey: true }, false],
        [{ metaKey: true }, false],
        [{ shiftKey: true }, false],
        [{ altKey: true }, false],
        [{ button: 1 }, false],
        [{ target: "_blank" }, false],
        [{ download: true }, false],
        [{ reload: true }, false],
        [{ hash: true }, false],
        [{ currentHash: "#heading" }, false],
        [{ currentHash: "#" }, false],
    ])("preserves same-page click semantics for %j", (options, prevented) => {
        const settings = options as {
            ctrlKey?: boolean;
            metaKey?: boolean;
            shiftKey?: boolean;
            altKey?: boolean;
            button?: number;
            target?: string;
            download?: boolean;
            reload?: boolean;
            hash?: boolean;
            currentHash?: string;
        };
        if (settings.currentHash) window.location.href += settings.currentHash;
        class Link {
            href = window.location.href + (settings.hash ? "#heading" : "");
            relList = { contains: () => false };
            closest() {
                return this;
            }
            hasAttribute(name: string) {
                return (
                    (name === "download" && settings.download) ||
                    (name === "data-astro-reload" && settings.reload)
                );
            }
            getAttribute(name: string) {
                return name === "target" ? settings.target : null;
            }
        }
        vi.stubGlobal("Element", Link);
        const event = Object.assign(new Event("click", { cancelable: true }), {
            button: settings.button ?? 0,
            ctrlKey: settings.ctrlKey ?? false,
            metaKey: settings.metaKey ?? false,
            shiftKey: settings.shiftKey ?? false,
            altKey: settings.altKey ?? false,
        });
        Object.defineProperty(event, "target", { value: new Link() });
        const tracking = vi.fn();
        documentMock.addEventListener("click", tracking);
        documentMock.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(prevented);
        expect(tracking).toHaveBeenCalledOnce();
    });

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
        // ready is already fulfilled: the selecting attributes must survive it.
        await settle();
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

    it("settles the shared installation gate without a second WAAPI animation", async () => {
        const nav = navigation();
        fire("astro:before-preparation", nav);
        fire("astro:before-swap", nav);
        const { prepareRouteMotion } = await import("../src/scripts/route-motion");
        const shared = prepareRouteMotion(nav);
        await shared.ready;
        let finished = false;
        void shared.finished.then(() => {
            finished = true;
        });
        await settle();
        expect(finished).toBe(false);
        nav.finish();
        await shared.finished;
        expect(finished).toBe(true);
    });

    it("uses a native-history gesture instead of stacking its own effect", () => {
        const nav = navigation();
        nav.navigationType = "traverse";
        nav.to = new URL("https://example.com/archives/");
        window.dispatchEvent(Object.assign(new Event("popstate"), { hasUAVisualTransition: true }));
        fire("astro:before-preparation", nav);
        fire("astro:before-swap", nav);
        expect(nav.newDocument.documentElement.dataset.staluxVtPreset).toBe("none");
    });

    it("does not move a restored offscreen title into view or capture it", () => {
        const nav = navigation();
        nav.navigationType = "traverse";
        Object.assign(window, { innerWidth: 390, innerHeight: 844 });
        const focus = {
            dataset: {} as Record<string, string>,
            getBoundingClientRect: () => ({
                width: 300,
                height: 50,
                top: -500,
                bottom: -450,
                left: 0,
                right: 300,
            }),
        };
        documentMock.querySelector = (selector) =>
            selector === "[data-stalux-motion-focus]" ? focus : null;
        fire("astro:before-preparation", nav);
        fire("astro:before-swap", nav);
        documentMock.documentElement = nav.newDocument.documentElement;
        fire("astro:after-swap");
        expect(focus.dataset.staluxMotionVisible).toBe("false");
        expect(documentMock.documentElement.dataset.staluxVtPreset).toBe("restore");
    });

    it("measures only the incoming title after swap and drops stale outgoing capture", () => {
        const nav = navigation();
        Object.assign(window, { innerWidth: 390, innerHeight: 844 });
        const focus = {
            dataset: { staluxMotionVisible: "true" } as Record<string, string>,
            removeAttribute: () => {
                delete focus.dataset.staluxMotionVisible;
            },
            getBoundingClientRect: vi.fn(() => ({
                width: 300,
                height: 50,
                top: 100,
                bottom: 150,
                left: 0,
                right: 300,
            })),
        };
        documentMock.querySelector = (selector) =>
            selector === "[data-stalux-motion-focus]" ? focus : null;
        fire("astro:before-preparation", nav);
        expect(focus.dataset.staluxMotionVisible).toBeUndefined();
        expect(focus.getBoundingClientRect).not.toHaveBeenCalled();
        fire("astro:before-swap", nav);
        documentMock.documentElement = nav.newDocument.documentElement;
        fire("astro:after-swap");
        expect(focus.getBoundingClientRect).toHaveBeenCalledOnce();
        expect(focus.dataset.staluxMotionVisible).toBe("true");
    });

    it("cleans preparation state when the preserved loader fails", async () => {
        const nav = navigation();
        nav.loader = async () => {
            throw new Error("offline");
        };
        const event = Object.assign(new Event("astro:before-preparation"), nav);
        documentMock.dispatchEvent(event);
        await expect(event.loader()).rejects.toThrow("offline");
        expect(documentMock.documentElement.dataset.staluxVtPreset).toBeUndefined();
    });
});
