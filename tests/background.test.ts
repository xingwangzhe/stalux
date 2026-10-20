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
    vi.stubGlobal("window", { __STALUX_BG_URLS__: ["/background/one.svg"] });
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

it("keeps decoded backgrounds out of the shared content animation", async () => {
    const layers = {
        a: { style: { opacity: "1", backgroundImage: "url(old.svg)" } },
        b: { style: { opacity: "0", backgroundImage: "" } },
    };
    const document = Object.assign(new EventTarget(), {
        body: { dataset: { staluxBgIndex: "0" } },
        querySelector: (selector: string) => (selector.includes('"a"') ? layers.a : layers.b),
    });
    vi.stubGlobal("window", { __STALUX_BG_URLS__: ["/background/one.svg"] });
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
        viewTransition: { ready: Promise.resolve(), finished: Promise.resolve() },
    });
    document.dispatchEvent(swap);
    prepareRouteMotion(swap).start({
        animate: () => ({ finished: content, cancel: vi.fn() }),
    } as unknown as HTMLElement);
    document.dispatchEvent(new Event("astro:page-load"));
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();
    expect(layers.b.style.opacity).toBe("0");
    finishContent();
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();
    expect(layers.b.style.opacity).toBe("1");
});
