import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mountListReveal, primeListReveal } from "../src/scripts/list-reveal";

type Animation = {
    finished: Promise<void>;
    cancel: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    play: ReturnType<typeof vi.fn>;
    effect: { updateTiming: ReturnType<typeof vi.fn> };
};
type Item = {
    animate: ReturnType<typeof vi.fn>;
    animation: Animation;
    isConnected: boolean;
};
type Container = {
    closest: (selector: string) => Element | null;
    querySelectorAll: (selector: string) => Item[];
    getBoundingClientRect: () => { top: number; bottom: number; width: number; height: number };
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

const item = (): Item => {
    const animation: Animation = {
        finished: new Promise(() => {}),
        cancel: vi.fn(),
        pause: vi.fn(),
        play: vi.fn(),
        effect: { updateTiming: vi.fn() },
    };
    return { animate: vi.fn(() => animation), animation, isConnected: true };
};
const container = (items: Item[], persisted = false, atTop = 100): Container => ({
    closest: (selector: string) =>
        persisted && selector === "[data-swup-persist]" ? ({} as Element) : null,
    querySelectorAll: () => items,
    // Rows sit at `atTop` in the viewport; a group far below is off-screen.
    getBoundingClientRect: () => ({ top: atTop, bottom: atTop + 400, width: 800, height: 400 }),
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
    vi.stubGlobal("window", { matchMedia: () => preference, innerHeight: 900 });
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

it("holds the incoming rows on the start frame before the observer fires", () => {
    const items = [item(), item()];
    const group = container(items);
    containers = [group];
    // The router calls this synchronously inside the swap, before painting.
    primeListReveal();
    expect(at(items).animate).toHaveBeenCalledOnce();
    expect(at(items).animation.pause).toHaveBeenCalledOnce();
    // Paused means the row already paints its backwards fill; it is not shown
    // finished first and clipped afterwards.
    expect(at(items).animation.play).not.toHaveBeenCalled();

    const dispose = mountListReveal();
    expect(observe).toHaveBeenCalledWith(group);
    enter(group);
    // The primed effect is reused, so the row never repaints from the authored
    // visible state between the swap and the wipe.
    expect(at(items).animate).toHaveBeenCalledOnce();
    expect(at(items).animation.play).toHaveBeenCalledOnce();
    // The stagger counts from the moment the group is actually on screen.
    expect(at(items).animation.effect.updateTiming).toHaveBeenCalledWith({ delay: 0 });
    expect(at(items, 1).animation.effect.updateTiming).toHaveBeenCalledWith({ delay: 45 });
    dispose?.();
});

it("keeps the held frame across a same-document remount", () => {
    const items = [item()];
    const group = container(items);
    containers = [group];
    primeListReveal();
    const dispose = mountListReveal();
    dispose?.();
    // A remount must not release the held row: that would paint the finished
    // row for a frame and clip it again, which is the flash being fixed.
    expect(at(items).animation.cancel).not.toHaveBeenCalled();
    const remount = mountListReveal();
    enter(group);
    expect(at(items).animate).toHaveBeenCalledOnce();
    expect(at(items).animation.play).toHaveBeenCalledOnce();
    remount?.();
});

it("releases a held row the abandoned visit never scrolled to", () => {
    vi.useFakeTimers();
    try {
        const items = [item()];
        containers = [container(items)];
        primeListReveal();
        mountListReveal();
        expect(at(items).animation.cancel).not.toHaveBeenCalled();
        vi.advanceTimersByTime(5000);
        // Back to the authored visible state instead of staying clipped.
        expect(at(items).animation.cancel).toHaveBeenCalledOnce();
        expect(at(items).animation.play).not.toHaveBeenCalled();
    } finally {
        vi.useRealTimers();
    }
});

it("releases held rows when the reader asks for less motion", () => {
    const items = [item()];
    containers = [container(items)];
    primeListReveal();
    mountListReveal();
    preference.matches = true;
    preference.dispatchEvent(new Event("change"));
    expect(at(items).animation.cancel).toHaveBeenCalled();
});

it("drops held rows that the swap detached", () => {
    const stale = item();
    stale.isConnected = false;
    containers = [container([stale])];
    primeListReveal();
    const fresh = item();
    containers = [container([fresh])];
    primeListReveal();
    // The next swap primes its own document and must not pin the old one.
    expect(fresh.animate).toHaveBeenCalledOnce();
    expect(stale.animation.cancel).toHaveBeenCalledOnce();
});

it("only holds the groups the reader can already see", () => {
    const onScreen = item();
    const farBelow = item();
    containers = [container([onScreen], false, 200), container([farBelow], false, 24000)];
    primeListReveal();
    // An archive page has one group per month. Holding all of them built
    // hundreds of paused effects inside the swap frame and dropped the frame the
    // entry cue needed, so only on-screen groups are held.
    expect(onScreen.animate).toHaveBeenCalledOnce();
    expect(farBelow.animate).not.toHaveBeenCalled();
});

it("never primes a document it would not animate", () => {
    const restored = item();
    containers = [container([restored])];
    dataset.staluxVtPreset = "restore";
    primeListReveal();
    expect(restored.animate).not.toHaveBeenCalled();

    dataset = {};
    preference.matches = true;
    primeListReveal();
    expect(restored.animate).not.toHaveBeenCalled();

    preference.matches = false;
    hidden = true;
    primeListReveal();
    expect(restored.animate).not.toHaveBeenCalled();

    hidden = false;
    containers = [container([item()], true)];
    primeListReveal();
    expect(observe).not.toHaveBeenCalled();
});
