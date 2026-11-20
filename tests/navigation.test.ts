// @vitest-environment happy-dom

import { afterEach, beforeEach, expect, it, vi } from "vitest";

const search = vi.hoisted(() => ({
    closeSearchDialog: vi.fn(),
    openSearchDialog: vi.fn(async () => undefined),
}));
vi.mock("../src/scripts/search-dialog", () => search);

let onResize: ResizeObserverCallback;

beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    // A fresh document is needed because navigation binds to the retained shell once.
    document.body.innerHTML = `
        <header class="stalux-site-header">
            <nav data-ref="stalux-site-nav">
                <button data-ref="stalux-nav-toggle"></button>
                <div>
                    <ul data-ref="stalux-nav-list"><li><button data-ref="stalux-search-btn"></button></li></ul>
                </div>
                <dialog id="stalux-mobile-navigation"><div data-ref="stalux-mobile-nav-panel"></div></dialog>
            </nav>
        </header>
        <template data-stalux-search></template>`;
    vi.stubGlobal(
        "ResizeObserver",
        class {
            constructor(cb: ResizeObserverCallback) {
                onResize = cb;
            }
            observe() {}
        },
    );
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

it("updates the sticky offset when the header height changes", () => {
    const header = document.querySelector("header");
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
});
