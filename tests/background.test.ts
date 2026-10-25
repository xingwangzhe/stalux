import { afterEach, beforeEach, expect, it, vi } from "vitest";

let documentMock: EventTarget & {
    readyState: string;
    body: { dataset: Record<string, string> };
    querySelector: (selector: string) => unknown;
};
let layers: {
    a: {
        isConnected: boolean;
        style: { opacity: string; backgroundImage: string; backgroundSize?: string };
    };
    b: {
        isConnected: boolean;
        style: { opacity: string; backgroundImage: string; backgroundSize?: string };
    };
};
let decodes: Array<{ resolve: () => void; reject: () => void }>;
let images: Array<{ decoding?: string; fetchPriority?: string; src?: string }>;
let saveData: boolean;
const settle = async () => {
    for (let tick = 0; tick < 6; tick++) await Promise.resolve();
};
beforeEach(() => {
    vi.resetModules();
    saveData = false;
    decodes = [];
    images = [];
    layers = {
        a: { isConnected: true, style: { opacity: "1", backgroundImage: "" } },
        b: { isConnected: true, style: { opacity: "0", backgroundImage: "" } },
    };
    documentMock = Object.assign(new EventTarget(), {
        readyState: "interactive",
        body: { dataset: { staluxBgIndex: "0", staluxBgLayer: "a" } },
        querySelector: (selector: string) => (selector.includes('"a"') ? layers.a : layers.b),
    });
    vi.stubGlobal("window", { __STALUX_BG_URLS__: ["/background/custom.svg"] });
    vi.stubGlobal("document", documentMock);
    vi.stubGlobal("navigator", {
        connection: {
            get saveData() {
                return saveData;
            },
        },
    });
    vi.stubGlobal(
        "Image",
        class {
            decoding = "";
            fetchPriority = "";
            src = "";
            constructor() {
                images.push(this);
            }
            decode() {
                return new Promise<void>((resolve, reject) =>
                    decodes.push({
                        resolve,
                        reject: () => reject(new Error("decode failed")),
                    }),
                );
            }
        },
    );
});
afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});
it("starts one low-priority custom decode as soon as the document is parsed", async () => {
    await import("../src/scripts/background");
    expect(images).toHaveLength(1);
    expect(images[0]).toMatchObject({
        src: "/background/custom.svg",
        decoding: "async",
        fetchPriority: "low",
    });
    expect(layers.b.style.backgroundImage).toBe("");
    documentMock.dispatchEvent(new Event("astro:page-load"));
    expect(images).toHaveLength(1);
    decodes[0]?.resolve();
    await settle();
    expect(layers.b.style.backgroundImage).toBe("url('/background/custom.svg')");
    expect(layers.b.style.opacity).toBe("1");
    expect(layers.a.style.opacity).toBe("0");
});
it("does not decode or change the background across fifty soft visits", async () => {
    await import("../src/scripts/background");
    decodes[0]?.resolve();
    await settle();
    const original = JSON.stringify(layers);
    for (let visit = 0; visit < 50; visit++)
        for (const type of ["astro:before-preparation", "astro:before-swap", "astro:page-load"])
            documentMock.dispatchEvent(new Event(type));
    await settle();
    expect(images).toHaveLength(1);
    expect(JSON.stringify(layers)).toBe(original);
});
it("does not duplicate installation or let late page-load events start another image", async () => {
    const module = await import("../src/scripts/background");
    module.installSessionBackground();
    module.installSessionBackground();
    documentMock.dispatchEvent(new Event("astro:page-load"));
    expect(images).toHaveLength(1);
    decodes[0]?.resolve();
    await settle();
    module.installSessionBackground();
    expect(images).toHaveLength(1);
});
it("waits for DOM parsing but not window.load", async () => {
    documentMock.readyState = "loading";
    await import("../src/scripts/background");
    expect(images).toHaveLength(0);
    documentMock.readyState = "interactive";
    documentMock.dispatchEvent(new Event("DOMContentLoaded"));
    expect(images).toHaveLength(1);
    documentMock.dispatchEvent(new Event("DOMContentLoaded"));
    expect(images).toHaveLength(1);
});
it("keeps the dark fallback when saveData is requested or decoding fails", async () => {
    saveData = true;
    await import("../src/scripts/background");
    expect(images).toHaveLength(0);
    expect(layers.a.style.opacity).toBe("1");
    vi.resetModules();
    vi.stubGlobal("window", { __STALUX_BG_URLS__: ["/background/custom.svg"] });
    saveData = false;
    await import("../src/scripts/background");
    decodes[0]?.reject();
    await settle();
    expect(layers.a.style.opacity).toBe("1");
    expect(layers.b.style.backgroundImage).toBe("");
});
it("does not mutate detached background shells after a late decode", async () => {
    await import("../src/scripts/background");
    layers.a.isConnected = false;
    layers.b.isConnected = false;
    decodes[0]?.resolve();
    await settle();
    expect(layers.b.style.backgroundImage).toBe("");
});
it("uses raster companions with the original ratio-only SVG contain sizing", async () => {
    vi.stubGlobal("window", {});
    await import("../src/scripts/background");
    expect(images[0]?.src).toMatch(/^\/background\/pattern-\d+\.min\.webp$/u);
    decodes[0]?.resolve();
    await settle();
    expect(layers.b.style.backgroundSize).toBe("contain");
});
it("keeps custom-image sizing unchanged", async () => {
    await import("../src/scripts/background");
    decodes[0]?.resolve();
    await settle();
    expect(layers.b.style.backgroundSize).toBeUndefined();
});
it("is harmless during an SSR import without window or document", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    await expect(import("../src/scripts/background")).resolves.toBeDefined();
    expect(images).toHaveLength(0);
});
