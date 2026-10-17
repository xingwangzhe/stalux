import { afterEach, expect, it, vi } from "vitest";

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
    await import("../src/scripts/background");
    let finish = () => {};
    const finished = new Promise<void>((resolve) => {
        finish = resolve;
    });
    document.dispatchEvent(new Event("astro:before-preparation"));
    document.dispatchEvent(
        Object.assign(new Event("astro:before-swap"), { viewTransition: { finished } }),
    );
    document.dispatchEvent(new Event("astro:page-load"));
    decode[0]?.();
    await Promise.resolve();
    expect(layers.b.style.opacity).toBe("0");
    document.dispatchEvent(new Event("astro:before-preparation"));
    finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(layers.b.style.opacity).toBe("0");
    document.dispatchEvent(new Event("astro:before-swap"));
    document.dispatchEvent(new Event("astro:page-load"));
    decode[1]?.();
    for (let tick = 0; tick < 4; tick++) await Promise.resolve();
    expect(layers.b.style.opacity).toBe("1");
    expect(layers.a.style.opacity).toBe("0");
    expect(layers.b.style.backgroundImage).toBe("url('/background/one.svg')");
});
