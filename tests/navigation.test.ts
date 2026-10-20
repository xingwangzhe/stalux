import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
    mount: undefined as undefined | (() => (() => void) | undefined),
    searchStyles: vi.fn(async () => undefined),
    openSearch: vi.fn(async () => undefined),
}));
vi.mock("../src/scripts/page-runtime", () => ({
    registerPageLifecycle: (_key: string, mount: typeof state.mount) => {
        state.mount = mount;
    },
}));
vi.mock("../src/scripts/search-dialog", () => ({
    ensureSearchStyles: state.searchStyles,
    upgradeAndOpenSearchDialog: state.openSearch,
}));
vi.mock("@pagefind/component-ui", () => ({}));

async function setup(mobile = false) {
    vi.resetModules();
    state.searchStyles.mockClear();
    state.openSearch.mockClear();
    const operations: string[] = [];
    class Style {
        values = new Map<string, string>();
        constructor(private name: string) {}
        getPropertyValue(property: string) {
            return this.values.get(property) ?? "";
        }
        setProperty(property: string, value: string) {
            operations.push(`write:${this.name}:${property}=${value}`);
            this.values.set(property, value);
        }
        get overflow() {
            return this.getPropertyValue("overflow");
        }
        set overflow(value: string) {
            this.setProperty("overflow", value);
        }
    }
    class Element extends EventTarget {
        attrs = new Map<string, string>();
        style: Style;
        children: Element[] = [];
        parentElement: Element | null = null;
        geometry = { clientWidth: 240, scrollWidth: 360, scrollLeft: 0, width: 180, height: 64 };
        dataset = new Proxy({} as Record<string, string>, {
            set: (_target, name, value) => {
                this.setAttribute(`data-${String(name)}`, value);
                return true;
            },
        });
        scrollBy = vi.fn();
        constructor(private name: string) {
            super();
            this.style = new Style(name);
        }
        private read(property: keyof Element["geometry"]) {
            operations.push(`read:${this.name}:${property}`);
            return this.geometry[property];
        }
        get clientWidth() {
            return this.read("clientWidth");
        }
        get scrollWidth() {
            return this.read("scrollWidth");
        }
        get scrollLeft() {
            return this.read("scrollLeft");
        }
        get offsetWidth() {
            return this.read("width");
        }
        get offsetHeight() {
            return this.read("height");
        }
        setAttribute(name: string, value: string) {
            operations.push(`write:${this.name}:${name}=${value}`);
            this.attrs.set(name, value);
        }
        removeAttribute(name: string) {
            if (this.attrs.delete(name)) operations.push(`write:${this.name}:remove-${name}`);
        }
        hasAttribute(name: string) {
            return this.attrs.has(name);
        }
        toggleAttribute(name: string, force: boolean) {
            if (force && !this.hasAttribute(name)) this.setAttribute(name, "");
            else if (!force) this.removeAttribute(name);
            return force;
        }
    }
    const nav = new Element("nav");
    const header = new Element("header");
    const list = new Element("list");
    list.children = [new Element("item1"), new Element("item2")];
    const toggle = new Element("toggle");
    const overlay = new Element("overlay");
    const left = new Element("left");
    const right = new Element("right");
    const search = new Element("search");
    const link = new Element("link");
    const body = new Element("body");
    const rootStyle = new Style("root");
    const fonts = new EventTarget();
    const dialog = { close: vi.fn() };
    const elements = new Map([
        ["[data-ref='stalux-site-nav']", nav],
        [".stalux-site-header", header],
        ["[data-ref='stalux-nav-list']", list],
        ["[data-ref='stalux-nav-toggle']", toggle],
        ["[data-ref='stalux-nav-overlay']", overlay],
        ["[data-ref='stalux-nav-scroll-left']", left],
        ["[data-ref='stalux-nav-scroll-right']", right],
        ["[data-ref='stalux-search-btn']", search],
    ]);
    const document = {
        body,
        fonts,
        documentElement: { style: rootStyle },
        querySelector: (selector: string) =>
            selector === "pagefind-modal#search" ? dialog : (elements.get(selector) ?? null),
        querySelectorAll: () => [link],
    };
    const media = { matches: mobile };
    let scrollY = 36;
    const window = Object.assign(new EventTarget(), { matchMedia: () => media });
    Object.defineProperty(window, "scrollY", {
        get: () => {
            operations.push("read:window:scrollY");
            return scrollY;
        },
    });
    let frameId = 0;
    const frames = new Map<number, FrameRequestCallback>();
    const disconnect = vi.fn();
    let notifyResize = () => {};
    vi.stubGlobal("HTMLElement", Element);
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", window);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
        frames.set(++frameId, callback);
        return frameId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
    vi.stubGlobal("getComputedStyle", () => {
        operations.push("read:list:computedStyle");
        return { fontSize: "16px", gap: "8px" };
    });
    vi.stubGlobal(
        "ResizeObserver",
        class {
            constructor(callback: () => void) {
                notifyResize = callback;
            }
            observe() {}
            disconnect = disconnect;
        },
    );
    await import("../src/scripts/navigation");
    const dispose = state.mount?.();
    return {
        operations,
        frames,
        nav,
        header,
        list,
        toggle,
        overlay,
        left,
        right,
        search,
        link,
        body,
        rootStyle,
        fonts,
        media,
        window,
        dialog,
        disconnect,
        dispose,
        notifyResize: () => notifyResize(),
        setScrollY: (value: number) => {
            scrollY = value;
        },
        flush: () => {
            const pending = [...frames.values()];
            frames.clear();
            for (const callback of pending) callback(0);
        },
    };
}

afterEach(() => vi.unstubAllGlobals());

function expectReadsBeforeWrites(operations: string[]) {
    const firstWrite = operations.findIndex((operation) => operation.startsWith("write:"));
    expect(firstWrite).toBeGreaterThan(-1);
    expect(
        operations.slice(firstWrite).filter((operation) => operation.startsWith("read:")),
    ).toEqual([]);
}

describe("navigation layout scheduling", () => {
    it("defers mount geometry and batches all layout reads before mutations", async () => {
        const page = await setup();
        expect(page.operations).toEqual([]);
        expect(page.frames.size).toBe(1);
        page.flush();
        expectReadsBeforeWrites(page.operations);
        expect(
            page.operations.filter((operation) => operation === "read:window:scrollY"),
        ).toHaveLength(1);
        expect(page.nav.hasAttribute("data-scrolled")).toBe(true);
        expect(page.toggle.hasAttribute("data-scrolled")).toBe(true);
        expect(page.rootStyle.getPropertyValue("--stalux-site-header-height")).toBe("64px");
        expect(page.rootStyle.getPropertyValue("--stalux-nav-offset")).toBe("80px");
        expect(page.list.style.getPropertyValue("--nav-scale")).toBe("0.75");
        page.dispose?.();
    });

    it("coalesces window scroll without measuring nav sizes or rewriting stable variables", async () => {
        const page = await setup();
        page.flush();
        page.operations.length = 0;
        page.setScrollY(0);
        for (let index = 0; index < 10; index++) page.window.dispatchEvent(new Event("scroll"));
        expect(page.operations).toEqual([]);
        expect(page.frames.size).toBe(1);
        page.flush();
        expectReadsBeforeWrites(page.operations);
        expect(page.operations.filter((operation) => operation.startsWith("read:"))).toEqual([
            "read:window:scrollY",
        ]);
        expect(page.operations.some((operation) => operation.startsWith("write:root:"))).toBe(
            false,
        );
        expect(page.nav.hasAttribute("data-scrolled")).toBe(false);
        page.dispose?.();
    });

    it("handles resize, fonts and overflow in one read phase and preserves persisted header values", async () => {
        const page = await setup();
        page.flush();
        page.toggle.dispatchEvent(new Event("click"));
        page.operations.length = 0;
        page.list.geometry.scrollLeft = 200;
        page.window.dispatchEvent(new Event("resize"));
        page.fonts.dispatchEvent(new Event("loadingdone"));
        page.notifyResize();
        page.list.dispatchEvent(new Event("scroll"));
        expect(page.operations).toEqual([]);
        expect(page.frames.size).toBe(1);
        page.flush();
        expectReadsBeforeWrites(page.operations);
        expect(page.operations.filter((operation) => operation.startsWith("write:root:"))).toEqual(
            [],
        );
        expect(page.operations.some((operation) => operation.includes("--nav-scale"))).toBe(false);
        expect(page.left.hasAttribute("data-visible")).toBe(true);
        expect(page.right.hasAttribute("data-visible")).toBe(false);
        expect(page.list.hasAttribute("data-state")).toBe(false);
        expect(page.body.style.overflow).toBe("");
        page.operations.length = 0;
        page.header.geometry.height = 80;
        page.list.geometry.clientWidth = 400;
        page.window.dispatchEvent(new Event("resize"));
        page.flush();
        expectReadsBeforeWrites(page.operations);
        expect(page.rootStyle.getPropertyValue("--stalux-site-header-height")).toBe("80px");
        expect(page.rootStyle.getPropertyValue("--stalux-nav-offset")).toBe("96px");
        expect(page.list.style.getPropertyValue("--nav-scale")).toBe("1");
        page.window.dispatchEvent(new Event("scroll"));
        page.dispose?.();
        expect(page.frames.size).toBe(0);
        expect(page.disconnect).toHaveBeenCalledOnce();
        expect(page.dialog.close).toHaveBeenCalledOnce();
        expect(page.rootStyle.getPropertyValue("--stalux-site-header-height")).toBe("80px");
        expect(page.rootStyle.getPropertyValue("--stalux-nav-offset")).toBe("96px");
        page.window.dispatchEvent(new Event("scroll"));
        expect(page.frames.size).toBe(0);
    });

    it("keeps mobile menu, links, horizontal scroll controls and lazy search working", async () => {
        const page = await setup(true);
        page.flush();
        page.toggle.dispatchEvent(new Event("click"));
        expect(page.list.hasAttribute("data-state")).toBe(true);
        expect(page.body.style.overflow).toBe("hidden");
        page.window.dispatchEvent(new Event("resize"));
        page.flush();
        expect(page.list.hasAttribute("data-state")).toBe(true);
        page.overlay.dispatchEvent(new Event("click"));
        expect(page.list.hasAttribute("data-state")).toBe(false);
        page.toggle.dispatchEvent(new Event("click"));
        page.link.dispatchEvent(new Event("click"));
        expect(page.body.style.overflow).toBe("");
        page.left.dispatchEvent(new Event("click"));
        page.right.dispatchEvent(new Event("click"));
        expect(page.list.scrollBy.mock.calls).toEqual([
            [{ left: -300, behavior: "smooth" }],
            [{ left: 300, behavior: "smooth" }],
        ]);
        page.toggle.dispatchEvent(new Event("click"));
        const click = new Event("click", { cancelable: true });
        page.search.dispatchEvent(click);
        await vi.dynamicImportSettled();
        expect(click.defaultPrevented).toBe(true);
        expect(page.body.style.overflow).toBe("");
        expect(state.searchStyles).toHaveBeenCalledOnce();
        expect(state.openSearch).toHaveBeenCalledOnce();
        page.dispose?.();
    });
});
