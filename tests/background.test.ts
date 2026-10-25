import { afterEach, expect, it, vi } from "vitest";
import type { RouteMotionEvent } from "../src/scripts/route-motion";

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

it("decodes before fading, waits for content motion and ignores superseded preparations", async () => {
    const document = Object.assign(new EventTarget(), {
        body: { dataset: { staluxBgIndex: "0" } },
        querySelector: (selector: string) => (selector.includes('"a"') ? layers.a : layers.b),
    });
    const layers = {
        a: { style: { opacity: "1", backgroundImage: "url(old.svg)" } },
        b: { style: { opacity: "0", backgroundImage: "" } },
    };
    const decode: Array<() => void> = [];
    vi.stubGlobal("window", {
        __STALUX_BG_URLS__: ["/background/one.svg"],
        innerWidth: 1440,
        innerHeight: 900,
        matchMedia: () => ({ matches: false }),
    });
    vi.stubGlobal("document", document);
    vi.stubGlobal("navigator", { connection: {} });
    vi.stubGlobal(
        "Image",
        class {
            decode() {
                return new Promise<void>((resolve) => decode.push(resolve));
            }
        },
    );
    const { prepareRouteMotion } = await import("../src/scripts/route-motion");
    await import("../src/scripts/background");
    let finish = () => {};
    const finished = new Promise<void>((resolve) => {
        finish = resolve;
    });
    document.dispatchEvent(new Event("astro:before-preparation"));
    const firstSwap = Object.assign(new Event("astro:before-swap"), {
        viewTransition: { finished },
    });
    document.dispatchEvent(firstSwap);
    prepareRouteMotion(firstSwap).start(null);
    document.dispatchEvent(new Event("astro:page-load"));
    decode[0]?.();
    await Promise.resolve();
    expect(layers.b.style.opacity).toBe("0");
    document.dispatchEvent(new Event("astro:before-preparation"));
    finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(layers.b.style.opacity).toBe("0");
    const secondSwap = new Event("astro:before-swap");
    document.dispatchEvent(secondSwap);
    prepareRouteMotion(secondSwap as RouteMotionEvent).start(null);
    document.dispatchEvent(new Event("astro:page-load"));
    decode[1]?.();
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();
    expect(layers.b.style.opacity).toBe("1");
    expect(layers.a.style.opacity).toBe("0");
    expect(layers.b.style.backgroundImage).toBe("url('/background/one.svg')");
});

it("keeps decoded backgrounds out of the shared heading animation", async () => {
    const layers = {
        a: { style: { opacity: "1", backgroundImage: "url(old.svg)" } },
        b: { style: { opacity: "0", backgroundImage: "" } },
    };
    const document = Object.assign(new EventTarget(), {
        body: { dataset: { staluxBgIndex: "0" } },
        querySelector: (selector: string) => (selector.includes('"a"') ? layers.a : layers.b),
    });
    vi.stubGlobal("window", {
        __STALUX_BG_URLS__: ["/background/one.svg"],
        innerWidth: 1440,
        innerHeight: 900,
        matchMedia: () => ({ matches: false }),
    });
    vi.stubGlobal("document", document);
    vi.stubGlobal("navigator", { connection: {} });
    vi.stubGlobal(
        "Image",
        class {
            decode() {
                return Promise.resolve();
            }
        },
    );
    const { prepareRouteMotion } = await import("../src/scripts/route-motion");
    await import("../src/scripts/background");
    let finishContent = () => {};
    const content = new Promise<void>((resolve) => {
        finishContent = resolve;
    });
    document.dispatchEvent(new Event("astro:before-preparation"));
    const swap = Object.assign(new Event("astro:before-swap"), {
        signal: new AbortController().signal,
    });
    document.dispatchEvent(swap);
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ finished: content, cancel }));
    prepareRouteMotion(swap).start({
        animate,
        isConnected: true,
        hasAttribute: (name: string) => name === "data-stalux-motion-focus",
        getBoundingClientRect: () => ({
            width: 300,
            height: 50,
            top: 100,
            bottom: 150,
            left: 0,
            right: 300,
        }),
    } as unknown as HTMLElement);
    document.dispatchEvent(new Event("astro:page-load"));
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();
    expect(animate).toHaveBeenCalledOnce();
    expect(cancel).not.toHaveBeenCalled();
    expect(layers.b.style.opacity).toBe("0");
    finishContent();
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();
    expect(cancel).toHaveBeenCalledOnce();
    expect(layers.b.style.opacity).toBe("1");
});

it("commits one background for a first load that outlives window.load", async () => {
    const layers = {
        a: { style: { opacity: "1", backgroundImage: "" } },
        b: { style: { opacity: "0", backgroundImage: "" } },
    };
    const document = Object.assign(new EventTarget(), {
        // 子资源卡住时 readyState 停在 interactive，window.load 上的 page-load 迟到。
        readyState: "interactive",
        body: { dataset: { staluxBgIndex: "0" } },
        querySelector: (selector: string) => (selector.includes('"a"') ? layers.a : layers.b),
    });
    const decode: Array<() => void> = [];
    vi.stubGlobal("window", { __STALUX_BG_URLS__: ["/background/one.svg", "/background/two.svg"] });
    vi.stubGlobal("document", document);
    vi.stubGlobal("navigator", { connection: {} });
    vi.stubGlobal(
        "Image",
        class {
            decode() {
                return new Promise<void>((resolve) => decode.push(resolve));
            }
        },
    );
    await import("../src/scripts/background");
    expect(decode).toHaveLength(1);

    // 迟到的 page-load 属于同一页，不能再解码并淡入第二张。
    document.dispatchEvent(new Event("astro:page-load"));
    expect(decode).toHaveLength(1);

    decode[0]?.();
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();
    expect(layers.b.style.opacity).toBe("1");
    expect(layers.a.style.opacity).toBe("0");
});
