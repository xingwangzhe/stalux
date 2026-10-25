import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const lifecycle = vi.hoisted(() => ({
    mount: undefined as (() => (() => void) | undefined) | undefined,
}));
vi.mock("../src/scripts/page-runtime", () => ({
    registerPageLifecycle: (_key: string, mount: typeof lifecycle.mount) => {
        lifecycle.mount = mount;
    },
}));

class Link extends EventTarget {
    dataset: { wordHash?: string } = {};
    closest(selector: string) {
        return selector === "a[data-word-hash]" ? this : null;
    }
}

async function setup(
    options: {
        hash?: string;
        reduced?: boolean;
        traversal?: boolean;
        hasWords?: boolean;
        missingTarget?: boolean;
    } = {},
) {
    const location = new URL(`https://example.com/words/?filter=mine${options.hash ?? ""}`);
    const oldState = {
        source: "swup",
        index: 17,
        custom: { reader: "saved-metadata" },
        url: "/words/?filter=mine#old",
    };
    const history = {
        state: oldState,
        replaceState: vi.fn((next: typeof oldState, _title: string, _hash: string) => {
            history.state = next;
        }),
    };
    const word = { dataset: {} as Record<string, string>, scrollIntoView: vi.fn() };
    const highlighted = { removeAttribute: vi.fn() };
    const link = new Link();
    link.dataset.wordHash = "#word-1";
    const document = Object.assign(new EventTarget(), {
        querySelector: () => (options.hasWords === false ? null : link),
        querySelectorAll: () => [highlighted],
        getElementById: (id: string) => (!options.missingTarget && id === "word-1" ? word : null),
    });
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrame = 0;
    const schedule = vi.fn((callback: FrameRequestCallback) => {
        const id = ++nextFrame;
        frames.set(id, callback);
        return id;
    });
    const cancel = vi.fn((id: number) => frames.delete(id));
    const runFrame = () => {
        const pending = frames.entries().next().value;
        if (!pending) throw new Error("No animation frame scheduled");
        const [id, callback] = pending;
        frames.delete(id);
        callback(0);
    };
    const window = {
        history,
        location,
        swup: { visit: { history: { popstate: options.traversal ?? false } } },
        matchMedia: () => ({ matches: options.reduced ?? false }),
    };
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", window);
    vi.stubGlobal("history", history);
    vi.stubGlobal("location", location);
    vi.stubGlobal("Element", Link);
    vi.stubGlobal("requestAnimationFrame", schedule);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    await import("../src/scripts/word-list");
    const click = (target: unknown = link) => {
        const event = new Event("click", { cancelable: true });
        Object.defineProperty(event, "target", { value: target });
        document.dispatchEvent(event);
        return event;
    };
    return {
        oldState,
        history,
        word,
        highlighted,
        frames,
        schedule,
        cancel,
        runFrame,
        click,
        mount: () => lifecycle.mount?.(),
    };
}

beforeEach(() => {
    vi.resetModules();
    lifecycle.mount = undefined;
});
afterEach(() => vi.unstubAllGlobals());

describe("word permalink navigation inside a Swup history entry", () => {
    it("keeps Swup and custom history metadata while recording pathname, query and hash", async () => {
        const env = await setup();
        const dispose = env.mount();
        const event = env.click();
        expect(event.defaultPrevented).toBe(true);
        expect(env.history.replaceState).toHaveBeenCalledExactlyOnceWith(
            {
                source: "swup",
                index: 17,
                custom: env.oldState.custom,
                url: "/words/?filter=mine#word-1",
            },
            "",
            "#word-1",
        );
        expect(env.history.state.source).toBe("swup");
        expect(env.history.state.index).toBe(17);
        expect(env.history.state.custom).toBe(env.oldState.custom);
        expect(env.highlighted.removeAttribute).toHaveBeenCalledExactlyOnceWith("data-glow");
        expect(env.word.dataset.glow).toBe("");
        dispose?.();
    });

    it.each([
        [true, "instant"],
        [false, "smooth"],
    ] as const)(
        "uses %s reduced motion to choose %s anchor scrolling",
        async (reduced, behavior) => {
            const env = await setup({ reduced });
            const dispose = env.mount();
            env.click();
            expect(env.word.scrollIntoView).toHaveBeenCalledExactlyOnceWith({
                behavior,
                block: "center",
            });
            dispose?.();
        },
    );

    it("does not override a restored deep reading position with the entry's original word hash", async () => {
        const env = await setup({ hash: "#word-1", traversal: true });
        const dispose = env.mount();
        expect(env.schedule).not.toHaveBeenCalled();
        expect(env.frames.size).toBe(0);
        expect(env.word.scrollIntoView).not.toHaveBeenCalled();
        expect(env.history.replaceState).not.toHaveBeenCalled();
        // Deliberate clicks still work after the history restoration settles.
        expect(env.click().defaultPrevented).toBe(true);
        expect(env.word.scrollIntoView).toHaveBeenCalledOnce();
        dispose?.();
    });

    it("still honors a normal initial word hash after exactly two animation frames", async () => {
        const env = await setup({ hash: "#word-1" });
        const dispose = env.mount();
        expect(env.schedule).toHaveBeenCalledTimes(1);
        expect(env.word.scrollIntoView).not.toHaveBeenCalled();
        env.runFrame();
        expect(env.schedule).toHaveBeenCalledTimes(2);
        expect(env.word.scrollIntoView).not.toHaveBeenCalled();
        env.runFrame();
        expect(env.word.scrollIntoView).toHaveBeenCalledExactlyOnceWith({
            behavior: "smooth",
            block: "center",
        });
        expect(env.history.state.url).toBe("/words/?filter=mine#word-1");
        expect(env.frames.size).toBe(0);
        dispose?.();
        expect(env.cancel).not.toHaveBeenCalled();
    });

    it.each([0, 1])(
        "cancels scheduled hash work and removes its click listener after %s frames",
        async (completedFrames) => {
            const env = await setup({ hash: "#word-1" });
            const dispose = env.mount();
            for (let frame = 0; frame < completedFrames; frame++) env.runFrame();
            dispose?.();
            expect(env.cancel).toHaveBeenCalledExactlyOnceWith(completedFrames + 1);
            expect(env.frames.size).toBe(0);
            expect(env.click().defaultPrevented).toBe(false);
            expect(env.word.scrollIntoView).not.toHaveBeenCalled();
            expect(env.history.replaceState).not.toHaveBeenCalled();
        },
    );

    it("does not mount on unrelated pages or rewrite history for a missing target", async () => {
        const unrelated = await setup({ hasWords: false, hash: "#word-1" });
        expect(unrelated.mount()).toBeUndefined();
        expect(unrelated.schedule).not.toHaveBeenCalled();
        expect(unrelated.click().defaultPrevented).toBe(false);
        const missing = await setup({ missingTarget: true });
        const dispose = missing.mount();
        missing.click();
        expect(missing.history.replaceState).not.toHaveBeenCalled();
        expect(missing.word.scrollIntoView).not.toHaveBeenCalled();
        dispose?.();
    });
});
