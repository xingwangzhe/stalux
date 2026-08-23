import { describe, expect, it, vi } from "vitest";

import { type PageRuntimeEnvironment, registerPageLifecycle } from "../src/scripts/page-runtime";

class RuntimeTarget extends EventTarget {
    readyState = "loading";
}

function environment(target = new RuntimeTarget()) {
    const queued: Array<() => void> = [];
    const value: PageRuntimeEnvironment = {
        host: {},
        target,
        queueTask: (callback) => queued.push(callback),
    };
    return { target, value, queued };
}

describe("page runtime", () => {
    it("mounts per page and disposes before remount and swap", () => {
        const { target, value } = environment();
        const dispose = vi.fn();
        const mount = vi.fn(() => dispose);
        const unregister = registerPageLifecycle("navigation", mount, value);

        target.dispatchEvent(new Event("astro:page-load"));
        expect(mount).toHaveBeenCalledTimes(1);
        target.dispatchEvent(new Event("astro:page-load"));
        expect(dispose).toHaveBeenCalledTimes(1);
        expect(mount).toHaveBeenCalledTimes(2);
        target.dispatchEvent(new Event("astro:before-swap"));
        expect(dispose).toHaveBeenCalledTimes(2);

        unregister();
        target.dispatchEvent(new Event("astro:page-load"));
        expect(mount).toHaveBeenCalledTimes(2);
    });

    it("deduplicates the same global lifecycle key", () => {
        const { target, value } = environment();
        const first = vi.fn();
        const second = vi.fn();
        const unregisterFirst = registerPageLifecycle("singleton", first, value);
        const unregisterSecond = registerPageLifecycle("singleton", second, value);
        expect(unregisterSecond).toBe(unregisterFirst);

        target.dispatchEvent(new Event("astro:page-load"));
        expect(first).toHaveBeenCalledOnce();
        expect(second).not.toHaveBeenCalled();
    });

    it("queues a mount for modules loaded after the initial page event", () => {
        const target = new RuntimeTarget();
        target.readyState = "complete";
        const { value, queued } = environment(target);
        const mount = vi.fn();
        registerPageLifecycle("late", mount, value);
        expect(mount).not.toHaveBeenCalled();
        expect(queued).toHaveLength(1);
        queued[0]?.();
        expect(mount).toHaveBeenCalledOnce();
    });

    it("is a no-op during server rendering", () => {
        const mount = vi.fn();
        const unregister = registerPageLifecycle("server", mount, undefined);
        unregister();
        expect(mount).not.toHaveBeenCalled();
    });
});
