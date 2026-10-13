import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
    let resolve = () => {};
    return {
        ready: new Promise<void>((done) => {
            resolve = done;
        }),
        release: () => resolve(),
        mount: undefined as (() => () => void) | undefined,
        constructed: vi.fn(),
        open: vi.fn(),
        destroy: vi.fn(),
    };
});
vi.mock("../src/scripts/page-runtime", () => ({
    registerPageLifecycle: (_key: string, mount: () => () => void) => {
        state.mount = mount;
    },
}));
vi.mock("photoswipe/lightbox", async () => {
    await state.ready;
    return {
        default: class {
            constructor() {
                state.constructed();
            }
            on() {}
            init() {}
            loadAndOpen = state.open;
            destroy = state.destroy;
        },
    };
});
vi.mock("photoswipe", () => ({ default: class {} }));
afterEach(() => vi.unstubAllGlobals());

describe("PhotoSwipe async lifecycle", () => {
    it("never mounts a late import into a disposed page and still opens on first click", async () => {
        class Anchor {
            closest() {
                return this;
            }
            querySelector() {
                return null;
            }
        }
        const anchor = new Anchor();
        const container = { querySelectorAll: () => [anchor] };
        const document = Object.assign(new EventTarget(), { querySelector: () => container });
        vi.stubGlobal("Element", Anchor);
        vi.stubGlobal("document", document);
        await import("../src/scripts/photoswipe");
        const click = () => {
            const event = new Event("click", { cancelable: true });
            Object.defineProperties(event, {
                target: { value: anchor },
                clientX: { value: 10 },
                clientY: { value: 20 },
            });
            document.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
        };
        const cleanup = state.mount?.();
        click();
        cleanup?.();
        state.release();
        await vi.dynamicImportSettled();
        expect(state.constructed).not.toHaveBeenCalled();
        expect(state.open).not.toHaveBeenCalled();
        const secondCleanup = state.mount?.();
        click();
        await vi.dynamicImportSettled();
        expect(state.constructed).toHaveBeenCalledOnce();
        expect(state.open).toHaveBeenCalledWith(0, undefined, { x: 10, y: 20 });
        secondCleanup?.();
        expect(state.destroy).toHaveBeenCalledOnce();

        let rejectDecode = (_error: Error) => {};
        const removeSource = vi.fn(() => rejectDecode(new Error("decode cancelled")));
        vi.stubGlobal(
            "Image",
            class {
                src = "";
                removeAttribute = removeSource;
                decode() {
                    return new Promise<void>((_resolve, reject) => {
                        rejectDecode = reject;
                    });
                }
            },
        );
        Object.defineProperty(anchor, "querySelector", {
            value: () => ({
                naturalWidth: 0,
                naturalHeight: 0,
                src: "https://example.com/image.jpg",
            }),
        });
        const finalCleanup = state.mount?.();
        click();
        await vi.dynamicImportSettled();
        finalCleanup?.();
        await Promise.resolve();
        expect(removeSource).toHaveBeenCalledWith("src");
        expect(state.destroy).toHaveBeenCalledTimes(2);
    });
});
