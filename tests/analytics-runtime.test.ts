import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteMotionEvent } from "../src/scripts/route-motion";

const clarityPackage = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock("@microsoft/clarity", () => ({ default: clarityPackage }));
let prepareMotion: typeof import("../src/scripts/route-motion").prepareRouteMotion;

async function loadRuntime() {
    prepareMotion = (await import("../src/scripts/route-motion")).prepareRouteMotion;
    await import("../src/scripts/analytics-runtime");
}

beforeEach(() => {
    vi.useFakeTimers();
    clarityPackage.init.mockReset();
    clarityPackage.init.mockImplementation((id: string) => {
        if (document.getElementById("clarity-script")) return;
        const script = document.createElement("script");
        script.id = "clarity-script";
        script.async = true;
        script.src = `https://www.clarity.ms/tag/${id}?ref=npm`;
        document.head.appendChild(script);
    });
});
afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
});

function environment(dataset: Record<string, string> = {}, autoStartMotion = true) {
    const scripts: Array<{
        id: string;
        tagName: string;
        dataset: Record<string, string>;
        attributes: Record<string, string>;
        src: string;
        async: boolean;
        fetchPriority: string;
        type?: string;
        onload: (() => void) | null;
        onerror: (() => void) | null;
        setAttribute(name: string, value: string): void;
        remove(): void;
    }> = [];
    const doc = Object.assign(new EventTarget(), {
        body: { dataset },
        hidden: false,
        title: "First page",
        referrer: "https://referrer.example/",
        head: { appendChild: (script: (typeof scripts)[number]) => scripts.push(script) },
        createElement: () => {
            const script: (typeof scripts)[number] = {
                id: "",
                tagName: "SCRIPT",
                dataset: {},
                attributes: {},
                src: "",
                async: false,
                fetchPriority: "",
                onload: null,
                onerror: null,
                setAttribute(name, value) {
                    this.attributes[name] = value;
                },
                remove() {
                    const index = scripts.indexOf(this);
                    if (index >= 0) scripts.splice(index, 1);
                },
            };
            return script;
        },
        getElementById: (id: string) => scripts.find((script) => script.id === id),
        querySelector: (selector: string) =>
            selector.includes("data-stalux-vercount")
                ? scripts.find((script) => script.dataset.staluxVercount)
                : selector.includes("clarity")
                  ? scripts.find(
                        (script) =>
                            script.dataset.staluxClarity ||
                            script.src.startsWith("https://www.clarity.ms/tag/"),
                    )
                  : undefined,
    });
    const host = Object.assign(new EventTarget(), {
        location: Object.assign(new URL("https://example.org/first/"), { reload: vi.fn() }),
        screen: { width: 1440, height: 900 },
        requestAnimationFrame: (callback: FrameRequestCallback) =>
            setTimeout(() => callback(performance.now()), 16) as unknown as number,
        cancelAnimationFrame: (id: number) => clearTimeout(id),
    });
    vi.stubGlobal("document", doc);
    vi.stubGlobal("window", host);
    vi.stubGlobal("navigator", { language: "zh-CN" });
    let currentMotion: RouteMotionEvent | undefined;
    doc.addEventListener("astro:before-swap", (event) => {
        currentMotion = event as Event & RouteMotionEvent;
    });
    return {
        scripts,
        doc,
        host,
        page: () => {
            if (autoStartMotion && currentMotion) prepareMotion(currentMotion).start(null);
            return doc.dispatchEvent(new Event("astro:page-load"));
        },
    };
}

describe("native analytics navigation", () => {
    it("replaces Vercount's loader for each incoming page", async () => {
        const { scripts, page } = environment();
        await loadRuntime();
        page();
        const first = scripts[0];
        page();
        expect(scripts).toHaveLength(1);
        expect(scripts[0]).not.toBe(first);
        expect(scripts[0]).toMatchObject({ async: true, src: "https://events.vercount.one/js" });
        expect(scripts[0]?.type).toBeUndefined();
    });

    it("initializes native Google/Clarity SDKs once and queues one manual Google view per page", async () => {
        const { scripts, page, host } = environment({
            staluxGaId: "G-TEST",
            staluxClarityId: "test-site",
        });
        await loadRuntime();
        page();
        page();
        await vi.advanceTimersByTimeAsync(100);
        const trackers = scripts.filter((script) => !script.dataset.staluxVercount);
        expect(trackers).toHaveLength(2);
        for (const tracker of trackers) {
            expect(tracker.async).toBe(true);
            expect(tracker.fetchPriority).toBe("low");
            expect(tracker.type).toBeUndefined();
        }
        const commands = (host as typeof host & { dataLayer: IArguments[] }).dataLayer.map((args) =>
            Array.from(args),
        );
        expect(commands.filter(([name]) => name === "config")).toEqual([
            ["config", "G-TEST", { send_page_view: false }],
        ]);
        expect(
            commands.filter(([name, event]) => name === "event" && event === "page_view"),
        ).toHaveLength(2);
        expect(clarityPackage.init).toHaveBeenCalledOnce();
        expect(scripts.find((script) => script.id === "clarity-script")?.src).toBe(
            "https://www.clarity.ms/tag/test-site?ref=npm",
        );
    });

    it("yields until content motion is ready and the routed content has a paint", async () => {
        const { page, host, doc } = environment({ staluxGaId: "G-TEST" });
        const gtag = vi.fn();
        const postTask = vi.fn((callback: () => void) => Promise.resolve(callback()));
        Object.assign(host, { gtag, scheduler: { postTask } });
        await loadRuntime();
        let ready: (() => void) | undefined;
        const transition = new Promise<void>((resolve) => {
            ready = resolve;
        });
        doc.dispatchEvent(
            Object.assign(new Event("astro:before-swap"), {
                viewTransition: { ready: transition },
            }),
        );
        page();
        await vi.advanceTimersByTimeAsync(2000);
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(0);
        ready?.();
        await vi.advanceTimersByTimeAsync(16);
        expect(postTask).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(16);
        expect(postTask).toHaveBeenCalledWith(expect.any(Function), { priority: "background" });
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(1);
    });

    it("shares the real content gate and sends after installation without waiting for animation finished", async () => {
        const { page, host, doc } = environment({ staluxGaId: "G-TEST" }, false);
        const gtag = vi.fn();
        Object.assign(host, {
            gtag,
            scheduler: { postTask: (callback: () => void) => Promise.resolve(callback()) },
        });
        await loadRuntime();
        const event = Object.assign(new Event("astro:before-swap"), {
            viewTransition: { ready: Promise.resolve(), finished: Promise.resolve() },
        });
        doc.dispatchEvent(event);
        page();
        await vi.advanceTimersByTimeAsync(2000);
        expect(gtag.mock.calls.filter(([, name]) => name === "page_view")).toHaveLength(0);
        let finishAnimation: (() => void) | undefined;
        const animation = {
            finished: new Promise<void>((resolve) => {
                finishAnimation = resolve;
            }),
            cancel: vi.fn(),
        };
        const animate = vi.fn(() => animation);
        prepareMotion(event).start({ animate } as unknown as HTMLElement);
        await vi.advanceTimersByTimeAsync(32);
        expect(animate).toHaveBeenCalledWith(
            { opacity: [0.7, 1] },
            { duration: 100, easing: "ease-out" },
        );
        expect(animation.cancel).not.toHaveBeenCalled();
        expect(gtag.mock.calls.filter(([, name]) => name === "page_view")).toHaveLength(1);
        finishAnimation?.();
        await vi.advanceTimersByTimeAsync(2000);
        expect(gtag.mock.calls.filter(([, name]) => name === "page_view")).toHaveLength(1);
    });

    it("keeps quick Google visits in FIFO order with each URL/title/referrer snapshot", async () => {
        const { page, host, doc } = environment({ staluxGaId: "G-TEST" });
        const gtag = vi.fn();
        Object.assign(host, { gtag });
        await loadRuntime();
        page();
        host.location.href = "https://example.org/second/?q=test";
        doc.title = "Second page";
        page();
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(0);
        await vi.advanceTimersByTimeAsync(100);
        expect(
            gtag.mock.calls
                .filter(([, event]) => event === "page_view")
                .map(([, , payload]) => payload),
        ).toEqual([
            {
                page_location: "https://example.org/first/",
                page_path: "/first/",
                page_title: "First page",
                page_referrer: "https://referrer.example/",
            },
            {
                page_location: "https://example.org/second/?q=test",
                page_path: "/second/?q=test",
                page_title: "Second page",
                page_referrer: "https://example.org/first/",
            },
        ]);
    });

    it("defers an older queued Google view across a new swap and ignores its expired task", async () => {
        const { page, host, doc } = environment({ staluxGaId: "G-TEST" });
        const gtag = vi.fn();
        const tasks: Array<() => void> = [];
        Object.assign(host, {
            gtag,
            scheduler: {
                postTask: (callback: () => void) => {
                    tasks.push(callback);
                    return new Promise(() => {});
                },
            },
        });
        await loadRuntime();
        page();
        await vi.advanceTimersByTimeAsync(32);
        expect(tasks).toHaveLength(1);

        let ready: (() => void) | undefined;
        const transition = new Promise<void>((resolve) => {
            ready = resolve;
        });
        doc.dispatchEvent(
            Object.assign(new Event("astro:before-swap"), {
                viewTransition: { ready: transition },
            }),
        );
        host.location.href = "https://example.org/second/";
        doc.title = "Second page";
        page();
        tasks[0]?.();
        await vi.advanceTimersByTimeAsync(1500);
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(0);
        expect(tasks).toHaveLength(1);

        ready?.();
        await vi.advanceTimersByTimeAsync(32);
        expect(tasks).toHaveLength(2);
        tasks[1]?.();
        await vi.advanceTimersByTimeAsync(32);
        expect(tasks).toHaveLength(3);
        tasks[2]?.();
        tasks[0]?.();
        await vi.advanceTimersByTimeAsync(2000);
        expect(
            gtag.mock.calls
                .filter(([, event]) => event === "page_view")
                .map(([, , payload]) => payload.page_location),
        ).toEqual(["https://example.org/first/", "https://example.org/second/"]);
    });

    it("flushes queued Google views on pagehide without a later duplicate task", async () => {
        const { page, host } = environment({ staluxGaId: "G-TEST" });
        const gtag = vi.fn();
        Object.assign(host, { gtag });
        await loadRuntime();
        page();
        page();
        host.dispatchEvent(new Event("pagehide"));
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(2);
        await vi.advanceTimersByTimeAsync(2000);
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(2);
    });

    it("flushes an unresolved transition on pagehide and ignores its later ready callback", async () => {
        const { page, host, doc } = environment({ staluxGaId: "G-TEST" });
        const gtag = vi.fn();
        Object.assign(host, { gtag });
        await loadRuntime();
        let ready: (() => void) | undefined;
        const transition = new Promise<void>((resolve) => {
            ready = resolve;
        });
        doc.dispatchEvent(
            Object.assign(new Event("astro:before-swap"), {
                viewTransition: { ready: transition },
            }),
        );
        page();
        host.dispatchEvent(new Event("pagehide"));
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(1);
        ready?.();
        await vi.advanceTimersByTimeAsync(2000);
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(1);
    });

    it("uses the bounded timer when a visible document stops producing animation frames", async () => {
        const { page, host } = environment({ staluxGaId: "G-TEST" });
        const gtag = vi.fn();
        Object.assign(host, { gtag, requestAnimationFrame: () => 1 });
        await loadRuntime();
        page();
        await vi.advanceTimersByTimeAsync(999);
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(0);
        await vi.advanceTimersByTimeAsync(1);
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(1);
    });

    it("flushes a hidden document and falls back if the task scheduler rejects", async () => {
        const { page, host, doc } = environment({ staluxGaId: "G-TEST" });
        const gtag = vi.fn();
        Object.assign(host, {
            gtag,
            scheduler: { postTask: () => Promise.reject(new Error("unavailable")) },
        });
        await loadRuntime();
        page();
        await vi.advanceTimersByTimeAsync(50);
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(1);
        page();
        doc.hidden = true;
        doc.dispatchEvent(new Event("visibilitychange"));
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(2);
        await vi.advanceTimersByTimeAsync(2000);
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(2);
    });

    it("handles a skipped transition, a starved task and a throwing SDK without blocking later views", async () => {
        const { page, host, doc } = environment({ staluxGaId: "G-TEST" });
        const gtag = vi.fn().mockImplementation((_, event) => {
            if (event === "page_view") throw new Error("SDK failed");
        });
        Object.assign(host, { gtag, scheduler: { postTask: () => new Promise(() => {}) } });
        await loadRuntime();
        doc.dispatchEvent(
            Object.assign(new Event("astro:before-swap"), {
                viewTransition: { ready: Promise.reject(new Error("skipped")) },
            }),
        );
        page();
        page();
        await vi.advanceTimersByTimeAsync(2100);
        expect(gtag.mock.calls.filter(([, event]) => event === "page_view")).toHaveLength(2);
    });

    it("keeps every queued Umami URL/title/referrer while preserving SDK click tracking", async () => {
        const { scripts, page, host, doc } = environment({
            staluxUmamiId: "site-id",
            staluxUmamiUrl: "https://stats.example/script.js",
        });
        const track = vi.fn();
        Object.assign(host, { umami: { track } });
        await loadRuntime();
        page();
        host.location.href = "https://example.org/second/";
        doc.title = "Second page";
        page();
        expect(track).not.toHaveBeenCalled();
        const sdk = scripts.find((script) => script.src.includes("stats.example"));
        expect(sdk?.attributes["data-auto-pageview"]).toBe("false");
        expect(sdk?.attributes["data-auto-track"]).toBeUndefined();
        sdk?.onload?.();
        await Promise.resolve();
        await Promise.resolve();
        expect(
            track.mock.calls.map(([payload]) => [payload.url, payload.title, payload.referrer]),
        ).toEqual([
            ["https://example.org/first/", "First page", "https://referrer.example/"],
            ["https://example.org/second/", "Second page", "https://example.org/first/"],
        ]);
        expect(scripts.filter((script) => script.src.includes("stats.example"))).toHaveLength(1);
    });

    it("releases failed SDK waits after 15 seconds and retries without blocking the router", async () => {
        const { scripts, page } = environment({
            staluxUmamiId: "site-id",
            staluxUmamiUrl: "https://stats.example/script.js",
        });
        await loadRuntime();
        page();
        const failed = scripts.find((script) => script.src.includes("stats.example"));
        await vi.advanceTimersByTimeAsync(15_000);
        expect(scripts).not.toContain(failed);
        page();
        expect(scripts.filter((script) => script.src.includes("stats.example"))).toHaveLength(1);
        expect(scripts.find((script) => script.src.includes("stats.example"))).not.toBe(failed);
    });

    it.each(["error", "timeout"])(
        "retries only its own failed official Clarity loader after %s",
        async (failure) => {
            const { scripts, page } = environment({ staluxClarityId: "test-site" });
            await loadRuntime();
            page();
            page();
            await vi.advanceTimersByTimeAsync(1);
            expect(clarityPackage.init).toHaveBeenCalledOnce();
            const first = scripts.find((script) => script.id === "clarity-script");
            expect(first?.dataset.staluxClarity).toBe("true");
            expect(first?.fetchPriority).toBe("low");
            if (failure === "error") {
                first?.onerror?.();
                await vi.advanceTimersByTimeAsync(1);
            } else await vi.advanceTimersByTimeAsync(15_000);
            expect(scripts).not.toContain(first);
            page();
            await vi.advanceTimersByTimeAsync(1);
            expect(clarityPackage.init).toHaveBeenCalledTimes(2);
            expect(scripts.filter((script) => script.id === "clarity-script")).toHaveLength(1);
            expect(scripts.find((script) => script.id === "clarity-script")).not.toBe(first);
        },
    );

    it("leaves a loaded official Clarity tag intact and ignores a late error callback", async () => {
        const { scripts, page } = environment({ staluxClarityId: "test-site" });
        await loadRuntime();
        page();
        await vi.advanceTimersByTimeAsync(1);
        const script = scripts.find((item) => item.id === "clarity-script");
        const lateError = script?.onerror;
        script?.onload?.();
        lateError?.();
        await vi.advanceTimersByTimeAsync(15_000);
        page();
        await vi.advanceTimersByTimeAsync(1);
        expect(scripts).toContain(script);
        expect(clarityPackage.init).toHaveBeenCalledOnce();
    });

    it.each(["official", "legacy"])(
        "adopts an existing %s Clarity tag without adding or removing a loader",
        async (kind) => {
            const { scripts, doc, page } = environment({ staluxClarityId: "test-site" });
            const external = doc.createElement();
            if (kind === "official") external.id = "clarity-script";
            external.src = "https://www.clarity.ms/tag/external-site";
            doc.head.appendChild(external);
            await loadRuntime();
            page();
            await vi.advanceTimersByTimeAsync(16_000);
            page();
            expect(clarityPackage.init).not.toHaveBeenCalled();
            expect(scripts).toContain(external);
            expect(external.onload).toBeNull();
            expect(external.onerror).toBeNull();
        },
    );

    it("does not create a second loader when another integration installs a tag during the npm import", async () => {
        const { scripts, doc, page } = environment({ staluxClarityId: "test-site" });
        await loadRuntime();
        page();
        const external = doc.createElement();
        external.src = "https://www.clarity.ms/tag/external-site";
        doc.head.appendChild(external);
        await vi.advanceTimersByTimeAsync(1);
        expect(clarityPackage.init).not.toHaveBeenCalled();
        expect(scripts).toContain(external);
    });

    it("treats an official init that silently inserts no script as retryable", async () => {
        const { scripts, page } = environment({ staluxClarityId: "test-site" });
        clarityPackage.init.mockImplementationOnce(() => undefined);
        await loadRuntime();
        page();
        await vi.advanceTimersByTimeAsync(1);
        expect(clarityPackage.init).toHaveBeenCalledOnce();
        expect(scripts.some((script) => script.id === "clarity-script")).toBe(false);
        page();
        await vi.advanceTimersByTimeAsync(1);
        expect(clarityPackage.init).toHaveBeenCalledTimes(2);
        expect(scripts.filter((script) => script.id === "clarity-script")).toHaveLength(1);
    });

    it("keeps an already loaded Clarity core without reconstructing a queue or tag", async () => {
        const { scripts, page, host } = environment({ staluxClarityId: "test-site" });
        const clarity = Object.assign(vi.fn(), { v: "test-version" });
        Object.assign(host, { clarity });
        await loadRuntime();
        page();
        await vi.advanceTimersByTimeAsync(1);
        expect(clarityPackage.init).not.toHaveBeenCalled();
        expect(scripts.some((script) => script.id === "clarity-script")).toBe(false);
        expect((host as typeof host & { clarity: unknown }).clarity).toBe(clarity);
    });

    it("refreshes a previous native runtime so persisted navigation listeners receive fixes", async () => {
        const { host, scripts, page } = environment();
        Object.assign(host, {
            __staluxAnalyticsRuntime: { installed: true, native: true, revision: 3 },
        });
        await loadRuntime();
        expect(host.location.reload).toHaveBeenCalledOnce();
        page();
        expect(scripts).toHaveLength(0);
    });

    it("reuses the current native runtime without a reload loop", async () => {
        const { host } = environment();
        Object.assign(host, {
            __staluxAnalyticsRuntime: { installed: true, native: true, revision: 4 },
        });
        await loadRuntime();
        expect(host.location.reload).not.toHaveBeenCalled();
    });

    it("reloads an already-open legacy worker session once rather than double-tracking", async () => {
        const { host, scripts, page } = environment({ staluxGaId: "G-TEST" });
        Object.assign(host, { __staluxAnalyticsRuntime: { installed: true } });
        await loadRuntime();
        expect(host.location.reload).toHaveBeenCalledOnce();
        page();
        expect(scripts).toHaveLength(0);
    });
});
