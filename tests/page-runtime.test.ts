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

    it("mounts as soon as the document is parsed and keeps that instance for page-load", () => {
        // 首访时 astro:page-load 由 window.load 派发；子资源卡住时 readyState 停在
        // interactive，只认 window.load 会让页面永久空白。
        const target = new RuntimeTarget();
        target.readyState = "interactive";
        const { value, queued } = environment(target);
        const dispose = vi.fn();
        const mount = vi.fn(() => dispose);
        registerPageLifecycle("early", mount, value);
        expect(queued).toHaveLength(1);
        queued[0]?.();
        expect(mount).toHaveBeenCalledOnce();

        target.dispatchEvent(new Event("astro:page-load"));
        expect(mount).toHaveBeenCalledOnce();
        expect(dispose).not.toHaveBeenCalled();

        // 下一次软导航仍然照常换挂载。
        target.dispatchEvent(new Event("astro:before-swap"));
        expect(dispose).toHaveBeenCalledOnce();
        target.dispatchEvent(new Event("astro:page-load"));
        expect(mount).toHaveBeenCalledTimes(2);
    });

    it("waits for DOMContentLoaded when the document is still parsing", () => {
        const { target, value, queued } = environment();
        const mount = vi.fn();
        registerPageLifecycle("parsing", mount, value);
        expect(mount).not.toHaveBeenCalled();
        target.dispatchEvent(new Event("DOMContentLoaded"));
        queued[0]?.();
        expect(mount).toHaveBeenCalledOnce();
        target.dispatchEvent(new Event("astro:page-load"));
        expect(mount).toHaveBeenCalledOnce();
    });

    it("does not mount the outgoing DOM when a swap lands before the early mount runs", () => {
        const target = new RuntimeTarget();
        target.readyState = "interactive";
        const { value, queued } = environment(target);
        const mount = vi.fn();
        registerPageLifecycle("early-swap", mount, value);
        target.dispatchEvent(new Event("astro:before-swap"));
        queued[0]?.();
        expect(mount).not.toHaveBeenCalled();
        target.dispatchEvent(new Event("astro:page-load"));
        expect(mount).toHaveBeenCalledOnce();
    });

    it("is a no-op during server rendering", () => {
        const mount = vi.fn();
        const unregister = registerPageLifecycle("server", mount, undefined);
        unregister();
        expect(mount).not.toHaveBeenCalled();
    });

    it("does not mount twice when page-load overtakes a queued late mount", () => {
        const target = new RuntimeTarget();
        target.readyState = "complete";
        const { value, queued } = environment(target);
        const mount = vi.fn();
        registerPageLifecycle("late-race", mount, value);
        target.dispatchEvent(new Event("astro:page-load"));
        queued[0]?.();
        expect(mount).toHaveBeenCalledOnce();
    });

    it("does not mount outgoing DOM when a swap overtakes a queued late mount", () => {
        const target = new RuntimeTarget();
        target.readyState = "complete";
        const { value, queued } = environment(target);
        const mount = vi.fn();
        registerPageLifecycle("late-swap", mount, value);
        target.dispatchEvent(new Event("astro:before-swap"));
        queued[0]?.();
        expect(mount).not.toHaveBeenCalled();
        target.dispatchEvent(new Event("astro:page-load"));
        expect(mount).toHaveBeenCalledOnce();
    });
    it("reports mount failures once and preserves the thrown error", () => {
        const target = new RuntimeTarget();
        target.readyState = "complete";
        const { value, queued } = environment(target);
        const error = new Error("mount failure");
        const output = vi.spyOn(console, "error").mockImplementation(() => undefined);
        try {
            registerPageLifecycle(
                "broken",
                () => {
                    throw error;
                },
                value,
            );
            expect(() => queued[0]?.()).toThrow(error);
            expect(output).toHaveBeenCalledOnce();
            expect(output.mock.calls[0]?.[0]).toContain("[stalux/broken] page mount failed");
        } finally {
            output.mockRestore();
        }
    });

    it("reports cleanup failures once and clears the disposer", () => {
        const target = new RuntimeTarget();
        target.readyState = "complete";
        const { value, queued } = environment(target);
        const error = new Error("cleanup failure");
        const output = vi.spyOn(console, "error").mockImplementation(() => undefined);
        try {
            const unregister = registerPageLifecycle(
                "broken-cleanup",
                () => () => {
                    throw error;
                },
                value,
            );
            queued[0]?.();
            expect(unregister).toThrow(error);
            expect(output).toHaveBeenCalledOnce();
            expect(unregister).not.toThrow();
            const mount = vi.fn();
            registerPageLifecycle("broken-cleanup", mount, value);
            target.dispatchEvent(new Event("astro:page-load"));
            expect(mount).toHaveBeenCalledOnce();
        } finally {
            output.mockRestore();
        }
    });
});
