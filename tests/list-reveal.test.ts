import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mountListReveal } from "../src/scripts/list-reveal";

type Item = { animate: ReturnType<typeof vi.fn>; cancel?: ReturnType<typeof vi.fn> };
type Container = {
    closest: (selector: string) => Element | null;
    querySelectorAll: (selector: string) => Item[];
};

let callback: IntersectionObserverCallback;
let observe: ReturnType<typeof vi.fn>;
let unobserve: ReturnType<typeof vi.fn>;
let disconnect: ReturnType<typeof vi.fn>;
let preference: EventTarget & { matches: boolean };
let dataset: Record<string, string>;
let containers: Container[];
/** Index access stays defined: the fixtures always create the row they assert. */
const at = <T>(list: T[], index = 0): T => list[index] as T;
let hidden: boolean;

const item = (): Item => ({
    animate: vi.fn(() => ({ finished: new Promise(() => {}), cancel: vi.fn() })),
});
const container = (items: Item[], persisted = false): Container => ({
    closest: (selector: string) =>
        persisted && selector === "[data-swup-persist]" ? ({} as Element) : null,
    querySelectorAll: () => items,
});
beforeEach(() => {
    hidden = false;
    dataset = {};
    preference = Object.assign(new EventTarget(), { matches: false });
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    containers = [];
    vi.stubGlobal(
        "IntersectionObserver",
        class {
            constructor(cb: IntersectionObserverCallback) {
                callback = cb;
            }
            observe = observe;
            unobserve = unobserve;
            disconnect = disconnect;
        },
    );
    vi.stubGlobal("window", { matchMedia: () => preference });
    vi.stubGlobal("document", {
        documentElement: { dataset },
        get hidden() {
            return hidden;
        },
        querySelectorAll: () => containers,
    });
});
afterEach(() => vi.unstubAllGlobals());

function enter(target: Container) {
    callback(
        [{ target, isIntersecting: true } as unknown as IntersectionObserverEntry],
        {} as never,
    );
}

it("unrolls one bounded group once it becomes visible", () => {
    const items = Array.from({ length: 20 }, item);
    const group = container(items);
    containers = [group];
    const dispose = mountListReveal();
    expect(observe).toHaveBeenCalledWith(group);
    enter(group);
    expect(unobserve).toHaveBeenCalledWith(group);
    // Sixteen rows cascade; the tail beyond the cap is left to the authored state.
    expect(items.filter((entry) => entry.animate.mock.calls.length > 0)).toHaveLength(16);
    expect(at(items).animate).toHaveBeenCalledWith(
        [
            {
                clipPath: "inset(-10px -10px 100% -10px)",
                opacity: 0.4,
                transform: "translate3d(0, -10px, 0)",
            },
            {
                clipPath: "inset(-10px -10px -10px -10px)",
                opacity: 1,
                transform: "translate3d(0, 0, 0)",
            },
        ],
        expect.objectContaining({ duration: 380, delay: 0, fill: "backwards" }),
    );
    expect(at(items, 15).animate).toHaveBeenCalledWith(expect.anything(), {
        duration: 380,
        delay: 400,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
        fill: "backwards",
    });
    expect(unobserve).toHaveBeenCalledOnce();
    dispose?.();
    expect(disconnect).toHaveBeenCalledOnce();
});

it("lets a running route cue settle before the sheet starts unrolling", () => {
    const items = [item()];
    const group = container(items);
    containers = [group];
    dataset.staluxVtPreset = "enter";
    const dispose = mountListReveal();
    enter(group);
    expect(at(items).animate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ delay: 150 }),
    );
    dispose?.();
});

it("leaves persisted shells, restored history and reduced motion alone", () => {
    const persisted = [item()];
    containers = [container(persisted, true)];
    expect(mountListReveal()).toBeUndefined();
    expect(observe).not.toHaveBeenCalled();

    containers = [container([item()])];
    dataset.staluxVtPreset = "restore";
    expect(mountListReveal()).toBeUndefined();

    dataset = {};
    preference.matches = true;
    expect(mountListReveal()).toBeUndefined();

    preference.matches = false;
    hidden = true;
    expect(mountListReveal()).toBeUndefined();
    expect(at(persisted).animate).not.toHaveBeenCalled();
});

it("skips a group that enters while the document is hidden", () => {
    const items = [item()];
    const group = container(items);
    containers = [group];
    const dispose = mountListReveal();
    hidden = true;
    enter(group);
    expect(at(items).animate).not.toHaveBeenCalled();
    dispose?.();
});
