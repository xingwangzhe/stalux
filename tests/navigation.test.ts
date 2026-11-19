// @vitest-environment happy-dom

import { afterEach, beforeEach, expect, it, vi } from "vitest";

const search = vi.hoisted(() => ({
    ensureSearchStyles: vi.fn(async () => undefined),
    upgradeAndOpenSearchDialog: vi.fn(async () => undefined),
}));
vi.mock("../src/scripts/search-dialog", () => search);
vi.mock("@pagefind/component-ui", () => ({}));

let onResize: ResizeObserverCallback;
let frame: FrameRequestCallback;

beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    // A fresh document is needed because navigation binds to the retained shell once.
    document.body.innerHTML = `
        <header class="stalux-site-header">
            <nav data-ref="stalux-site-nav">
                <button data-ref="stalux-nav-toggle"></button>
                <div>
                    <button data-ref="stalux-nav-scroll-left"></button>
                    <ul data-ref="stalux-nav-list"><li><button data-ref="stalux-search-btn"></button></li></ul>
                    <button data-ref="stalux-nav-scroll-right"></button>
                </div>
                <dialog id="stalux-mobile-navigation"><div data-ref="stalux-mobile-nav-panel"></div></dialog>
            </nav>
        </header>
        <pagefind-modal id="search"></pagefind-modal>`;
    vi.stubGlobal(
        "ResizeObserver",
        class {
            constructor(cb: ResizeObserverCallback) {
                onResize = cb;
            }
            observe() {}
        },
    );
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
        frame = callback;
        return 1;
    });
    await import("../src/scripts/navigation");
});

afterEach(() => {
    document.body.replaceChildren();
    document.documentElement.removeAttribute("style");
    vi.unstubAllGlobals();
});

it("moves the same list into the native dialog and restores it on close", () => {
    const list = document.querySelector("[data-ref='stalux-nav-list']");
    const container = list?.parentElement;
    const toggle = document.querySelector<HTMLButtonElement>("[data-ref='stalux-nav-toggle']");
    const dialog = document.querySelector<HTMLDialogElement>("dialog");
    toggle?.click();
    expect(dialog?.open).toBe(true);
    expect(dialog?.contains(list ?? null)).toBe(true);
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    document.dispatchEvent(new Event("astro:after-swap"));
    dialog?.dispatchEvent(new Event("close"));
    expect(dialog?.open).toBe(false);
    expect(list?.parentElement).toBe(container);
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
});

it("consumes the resize entry and updates overflow in the scheduled frame", () => {
    const header = document.querySelector("header");
    const list = document.querySelector("[data-ref='stalux-nav-list']");
    const right = document.querySelector("[data-ref='stalux-nav-scroll-right']");
    Object.defineProperties(list, {
        scrollLeft: { value: 0 },
        scrollWidth: { value: 420 },
        clientWidth: { value: 300 },
    });
    onResize(
        [
            {
                target: header,
                borderBoxSize: [{ blockSize: 62, inlineSize: 300 }],
                contentBoxSize: [],
                contentRect: new DOMRect(),
                devicePixelContentBoxSize: [],
            },
        ] as ResizeObserverEntry[],
        {} as ResizeObserver,
    );
    expect(document.documentElement.style.getPropertyValue("--stalux-nav-offset")).toBe("78px");
    expect(right?.hasAttribute("data-visible")).toBe(false);
    frame(0);
    expect(right?.hasAttribute("data-visible")).toBe(true);
    expect(right?.getAttribute("aria-disabled")).toBe("false");
});
