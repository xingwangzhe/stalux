import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
    mount: undefined as undefined | (() => () => void),
    load: vi.fn(),
}));
vi.mock("../src/scripts/page-runtime", () => ({
    registerPageLifecycle: (_key: string, mount: () => () => void) => {
        state.mount = mount;
    },
}));
vi.mock("../src/scripts/waline-client", () => ({ mountWaline: state.load }));
async function setup() {
    vi.resetModules();
    state.load.mockReset();
    const destroy = vi.fn();
    state.load.mockReturnValue(destroy);
    const retry = Object.assign(new EventTarget(), { hidden: true });
    const feedback = { hidden: true };
    const container = {
        dataset: { walineConfig: btoa(JSON.stringify({ serverURL: "https://example.com" })) },
        querySelector: (s: string) => (s.includes("retry") ? retry : feedback),
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
    };
    const element = { isConnected: true };
    let intersect: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal("document", {
        querySelector: (s: string) => (s === "#waline-container" ? container : element),
    });
    const reload = vi.fn();
    vi.stubGlobal("window", { IntersectionObserver: true, innerHeight: 800, location: { reload } });
    vi.stubGlobal(
        "IntersectionObserver",
        class {
            constructor(callback: typeof intersect) {
                intersect = callback;
            }
            observe() {}
            disconnect = vi.fn();
        },
    );
    await import("../src/scripts/waline");
    const dispose = state.mount?.();
    return {
        retry,
        reload,
        feedback,
        destroy,
        dispose,
        visible: () => intersect([{ isIntersecting: true }]),
    };
}
afterEach(() => vi.unstubAllGlobals());
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
describe("Waline page lifecycle", () => {
    it("initializes once for repeated viewport notifications and destroys before swap", async () => {
        const page = await setup();
        page.visible();
        page.visible();
        await settle();
        page.visible();
        expect(state.load).toHaveBeenCalledTimes(1);
        page.dispose?.();
        expect(page.destroy).toHaveBeenCalledOnce();
    });
    it("does not mount a module that resolves after navigation", async () => {
        const page = await setup();
        page.visible();
        page.dispose?.();
        await settle();
        expect(state.load).not.toHaveBeenCalled();
    });
    it("reloads the document after initialization failure and removes the retry listener on disposal", async () => {
        const page = await setup();
        state.load.mockImplementationOnce(() => {
            throw new Error("network");
        });
        page.visible();
        await settle();
        expect(page.retry.hidden).toBe(false);
        expect(page.feedback.hidden).toBe(false);
        page.retry.dispatchEvent(new Event("click"));
        await settle();
        expect(page.reload).toHaveBeenCalledTimes(1);
        expect(state.load).toHaveBeenCalledTimes(1);
        page.dispose?.();
        page.retry.dispatchEvent(new Event("click"));
        await settle();
        expect(page.reload).toHaveBeenCalledTimes(1);
    });
});
