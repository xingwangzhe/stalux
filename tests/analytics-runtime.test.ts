import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
});

function environment(dataset: Record<string, string> = {}) {
    const scripts: Array<{
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
        title: "First page",
        referrer: "https://referrer.example/",
        head: { appendChild: (script: (typeof scripts)[number]) => scripts.push(script) },
        createElement: () => {
            const script: (typeof scripts)[number] = {
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
        querySelector: () => scripts.find((script) => script.dataset.staluxVercount),
    });
    const host = Object.assign(new EventTarget(), {
        location: Object.assign(new URL("https://example.org/first/"), { reload: vi.fn() }),
        screen: { width: 1440, height: 900 },
    });
    vi.stubGlobal("document", doc);
    vi.stubGlobal("window", host);
    vi.stubGlobal("navigator", { language: "zh-CN" });
    return { scripts, doc, host, page: () => doc.dispatchEvent(new Event("astro:page-load")) };
}

describe("native analytics navigation", () => {
    it("replaces Vercount's loader for each incoming page", async () => {
        const { scripts, page } = environment();
        await import("../src/scripts/analytics-runtime");
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
        await import("../src/scripts/analytics-runtime");
        page();
        page();
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
    });

    it("keeps every queued Umami URL/title/referrer while preserving SDK click tracking", async () => {
        const { scripts, page, host, doc } = environment({
            staluxUmamiId: "site-id",
            staluxUmamiUrl: "https://stats.example/script.js",
        });
        const track = vi.fn();
        Object.assign(host, { umami: { track } });
        await import("../src/scripts/analytics-runtime");
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
        await import("../src/scripts/analytics-runtime");
        page();
        const failed = scripts.find((script) => script.src.includes("stats.example"));
        await vi.advanceTimersByTimeAsync(15_000);
        expect(scripts).not.toContain(failed);
        page();
        expect(scripts.filter((script) => script.src.includes("stats.example"))).toHaveLength(1);
        expect(scripts.find((script) => script.src.includes("stats.example"))).not.toBe(failed);
    });

    it("refreshes a previous native runtime so persisted navigation listeners receive fixes", async () => {
        const { host, scripts, page } = environment();
        Object.assign(host, {
            __staluxAnalyticsRuntime: { installed: true, native: true, revision: 2 },
        });
        await import("../src/scripts/analytics-runtime");
        expect(host.location.reload).toHaveBeenCalledOnce();
        page();
        expect(scripts).toHaveLength(0);
    });

    it("reuses the current native runtime without a reload loop", async () => {
        const { host } = environment();
        Object.assign(host, {
            __staluxAnalyticsRuntime: { installed: true, native: true, revision: 3 },
        });
        await import("../src/scripts/analytics-runtime");
        expect(host.location.reload).not.toHaveBeenCalled();
    });

    it("reloads an already-open legacy worker session once rather than double-tracking", async () => {
        const { host, scripts, page } = environment({ staluxGaId: "G-TEST" });
        Object.assign(host, { __staluxAnalyticsRuntime: { installed: true } });
        await import("../src/scripts/analytics-runtime");
        expect(host.location.reload).toHaveBeenCalledOnce();
        page();
        expect(scripts).toHaveLength(0);
    });
});
