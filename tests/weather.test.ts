import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWeatherClient, WEATHER_TTL, weatherDescription } from "../src/scripts/weather";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});
const location = {
    ip: "192.0.2.1",
    city: "Test City",
    loc: "0,10.12345",
    latitude: 0,
    longitude: 10.12345,
};
const weather = { current: { temperature_2m: 20.2, apparent_temperature: 19.4, weather_code: 2 } };
function setup(cached?: unknown) {
    const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(JSON.stringify(location)))
        .mockResolvedValue(new Response(JSON.stringify(weather)));
    const storage = {
        getItem: vi.fn(() => (cached === undefined ? null : JSON.stringify(cached))),
        setItem: vi.fn(),
    };
    const client = createWeatherClient({ fetcher, storage });
    return { fetcher, storage, client };
}
async function settle() {
    await vi.advanceTimersByTimeAsync(0);
}

describe("weather client", () => {
    it("uses approximate coordinates, validates responses and stores only display fields, without coordinates", async () => {
        const { client, fetcher, storage } = setup();
        const render = vi.fn();
        const stop = client.subscribe(render);
        await settle();
        expect(fetcher).toHaveBeenCalledTimes(2);
        const url = new URL(String(fetcher.mock.calls[1]?.[0]));
        expect(url.searchParams.get("latitude")).toBe("0.00");
        expect(url.searchParams.get("longitude")).toBe("10.12");
        expect(render.mock.lastCall?.[0]).toMatchObject({
            status: "ready",
            data: { city: "Test City", code: 2 },
        });
        const cache = JSON.parse(storage.setItem.mock.calls[0]?.[1] ?? "{}");
        expect(Object.keys(cache).sort()).toEqual([
            "apparent",
            "city",
            "code",
            "ip",
            "temperature",
            "updated",
        ]);
        expect(vi.getTimerCount()).toBe(1);
        stop();
        expect(vi.getTimerCount()).toBe(0);
    });
    it("shares in-flight requests between subscribers", async () => {
        const { client, fetcher } = setup();
        const a = vi.fn(),
            b = vi.fn();
        const stopA = client.subscribe(a),
            stopB = client.subscribe(b);
        await settle();
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(b.mock.lastCall?.[0].status).toBe("ready");
        stopA();
        expect(vi.getTimerCount()).toBe(1);
        stopB();
        expect(vi.getTimerCount()).toBe(0);
    });
    it("uses a fresh cache across remounts and refreshes only when expired", async () => {
        const data = { city: "Cached", temperature: 10, apparent: 9, code: 0, updated: Date.now() };
        const { client, fetcher } = setup(data);
        const render = vi.fn();
        let stop = client.subscribe(render);
        await settle();
        expect(fetcher).not.toHaveBeenCalled();
        stop();
        vi.advanceTimersByTime(1000);
        stop = client.subscribe(render);
        await settle();
        expect(fetcher).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(WEATHER_TTL - 1000);
        expect(fetcher).toHaveBeenCalledTimes(2);
        stop();
    });
    it.each([
        null,
        { city: "Bad", updated: Date.now(), temperature: "20" },
        { city: "Future", updated: Date.now() + 10000, temperature: 2, apparent: 2, code: 0 },
    ])("ignores invalid cache %j", async (cached) => {
        const { client, fetcher } = setup(cached);
        const stop = client.subscribe(vi.fn());
        await settle();
        expect(fetcher).toHaveBeenCalledTimes(2);
        stop();
    });
    it.each([
        { error: true },
        { ...location, loc: "100,10", latitude: 100 },
        { ...location, loc: "0,200", longitude: 200 },
        { ...location, city: " " },
    ])("rejects invalid location %j", async (invalid) => {
        const { client, fetcher } = setup();
        fetcher.mockReset().mockResolvedValue(new Response(JSON.stringify(invalid)));
        const render = vi.fn();
        const stop = client.subscribe(render);
        await settle();
        expect(render.mock.lastCall?.[0].status).toBe("error");
        expect(fetcher).toHaveBeenCalledTimes(2);
        stop();
    });
    it("handles HTTP and malformed weather failures with explicit retry", async () => {
        const { client, fetcher } = setup();
        fetcher.mockReset().mockResolvedValueOnce(new Response("", { status: 429 }));
        const render = vi.fn();
        const stop = client.subscribe(render);
        await settle();
        expect(render.mock.lastCall?.[0].status).toBe("error");
        fetcher
            .mockResolvedValueOnce(new Response(JSON.stringify(location)))
            .mockResolvedValueOnce(new Response("{}"));
        client.refresh();
        await settle();
        expect(render.mock.lastCall?.[0].status).toBe("error");
        stop();
    });
    it.each([
        new Response("", { status: 429 }),
        new Response(JSON.stringify({ city: "Bad", loc: "," })),
    ])("falls back to IPinfo after unavailable or malformed IP.SB", async (response) => {
        const { client, fetcher } = setup();
        fetcher
            .mockReset()
            .mockResolvedValueOnce(response)
            .mockResolvedValueOnce(new Response(JSON.stringify(location)))
            .mockResolvedValueOnce(new Response(JSON.stringify(weather)));
        const render = vi.fn();
        const stop = client.subscribe(render);
        await settle();
        expect(fetcher).toHaveBeenCalledTimes(3);
        expect(String(fetcher.mock.calls[1]?.[0])).toContain("ipinfo.io");
        expect(render.mock.lastCall?.[0].status).toBe("ready");
        stop();
    });
    it("keeps stale weather after an update fails", async () => {
        const data = {
            city: "Cached",
            temperature: 10,
            apparent: 9,
            code: 0,
            updated: Date.now() - WEATHER_TTL,
        };
        const { client, fetcher } = setup(data);
        fetcher.mockReset().mockRejectedValue(new Error("offline"));
        const render = vi.fn();
        const stop = client.subscribe(render);
        await settle();
        expect(render.mock.lastCall?.[0]).toEqual({ status: "error", data });
        stop();
    });
    it("aborts and prevents late rendering after the last subscriber leaves", async () => {
        const { client, fetcher } = setup();
        let resolve!: (response: Response) => void;
        fetcher.mockReset().mockImplementation(
            () =>
                new Promise((r) => {
                    resolve = r;
                }),
        );
        const render = vi.fn();
        const stop = client.subscribe(render);
        const signal = fetcher.mock.calls[0]?.[1]?.signal;
        stop();
        expect(signal?.aborted).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
        const count = render.mock.calls.length;
        resolve(new Response(JSON.stringify(location)));
        await settle();
        expect(render).toHaveBeenCalledTimes(count);
    });
    it("times out stalled requests", async () => {
        const { client, fetcher } = setup();
        fetcher
            .mockReset()
            .mockImplementation(
                (_url, opts) =>
                    new Promise((_resolve, reject) =>
                        opts?.signal?.addEventListener("abort", () => reject(new Error("aborted"))),
                    ),
            );
        const render = vi.fn();
        const stop = client.subscribe(render);
        await vi.advanceTimersByTimeAsync(10000);
        expect(render.mock.lastCall?.[0].status).toBe("error");
        stop();
    });
    it("continues when browser storage is blocked", async () => {
        const { fetcher } = setup();
        const storage = {
            getItem: () => {
                throw Error("blocked");
            },
            setItem: () => {
                throw Error("blocked");
            },
        };
        const client = createWeatherClient({ fetcher, storage });
        const render = vi.fn();
        const stop = client.subscribe(render);
        await settle();
        expect(render.mock.lastCall?.[0].status).toBe("ready");
        stop();
    });
    it("does not fetch without subscribers", () => {
        const { client, fetcher } = setup();
        client.refresh();
        expect(fetcher).not.toHaveBeenCalled();
    });
});
it("maps all weather categories with an unknown fallback", () => {
    for (const code of [0, 1, 2, 3, 45, 51, 61, 71, 95, 999]) {
        expect(weatherDescription(code, "zh-CN")).not.toBe("");
        expect(weatherDescription(code, "en")).not.toBe("");
    }
    expect(weatherDescription(999, "en")).toBe("Unknown");
});

async function browserWeather(languages = ["zh-CN"]) {
    vi.resetModules();
    class Button extends EventTarget {
        hidden = true;
    }
    const items = languages.map((lang) => {
        const ipOutput = { textContent: "" },
            output = { textContent: "" },
            status = { textContent: "" },
            retry = new Button();
        const element = {
            dataset: { lang },
            querySelector: vi.fn((selector: string) =>
                selector.includes("location")
                    ? ipOutput
                    : selector.includes("output")
                      ? output
                      : selector.includes("status")
                        ? status
                        : retry,
            ),
        };
        return { output, status, retry, element, ipOutput };
    });
    class Doc extends EventTarget {
        hidden = false;
        querySelectorAll = vi.fn(() => items.map((item) => item.element));
    }
    const doc = new Doc();
    const observers: Array<{
        callback: IntersectionObserverCallback;
        disconnect: ReturnType<typeof vi.fn>;
    }> = [];
    class Observer {
        disconnect = vi.fn();
        observe = vi.fn();
        constructor(public callback: IntersectionObserverCallback) {
            observers.push(this);
        }
    }
    const fetcher = vi
        .fn<typeof fetch>()
        .mockImplementation(
            async (url) =>
                new Response(
                    JSON.stringify(/ip\.sb|ipinfo/.test(String(url)) ? location : weather),
                ),
        );
    vi.stubGlobal("document", doc);
    vi.stubGlobal("IntersectionObserver", Observer);
    vi.stubGlobal("fetch", fetcher);
    vi.stubGlobal("sessionStorage", { getItem: () => null, setItem: vi.fn() });
    const { mountWeather } = await import("../src/scripts/weather");
    const visible = (index: number, value: boolean) =>
        observers[index]?.callback(
            [{ isIntersecting: value }] as IntersectionObserverEntry[],
            {} as IntersectionObserver,
        );
    return { doc, items, observers, fetcher, mountWeather, visible };
}

describe("weather page lifecycle", () => {
    it("does no work offscreen or in background and resumes with the shared cache", async () => {
        const { doc, items, fetcher, mountWeather, visible, observers } = await browserWeather();
        const cleanup = mountWeather();
        expect(fetcher).not.toHaveBeenCalled();
        visible(0, true);
        await settle();
        expect(items[0]?.output.textContent).toContain("Test City");
        expect(items[0]?.output.textContent).toContain("多云");
        expect(items[0]?.ipOutput.textContent).toContain("192.0.2.1");
        doc.hidden = true;
        doc.dispatchEvent(new Event("visibilitychange"));
        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(1000);
        expect(fetcher).toHaveBeenCalledTimes(2);
        doc.hidden = false;
        doc.dispatchEvent(new Event("visibilitychange"));
        await settle();
        expect(fetcher).toHaveBeenCalledTimes(2);
        visible(0, false);
        expect(vi.getTimerCount()).toBe(0);
        cleanup?.();
        expect(observers[0]?.disconnect).toHaveBeenCalledOnce();
    });
    it("shares one request across independent language instances", async () => {
        const { items, fetcher, mountWeather, visible } = await browserWeather(["zh-CN", "en"]);
        const cleanup = mountWeather();
        visible(0, true);
        visible(1, true);
        await settle();
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(items[1]?.output.textContent).toContain("Partly cloudy");
        expect(vi.getTimerCount()).toBe(1);
        cleanup?.();
        expect(vi.getTimerCount()).toBe(0);
    });
    it("shows an error and retries without preserving stale listeners", async () => {
        const { items, fetcher, mountWeather, visible, doc } = await browserWeather();
        fetcher
            .mockRejectedValueOnce(new Error("offline"))
            .mockRejectedValueOnce(new Error("offline"));
        const remove = vi.spyOn(doc, "removeEventListener");
        const cleanup = mountWeather();
        visible(0, true);
        await settle();
        expect(items[0]?.retry.hidden).toBe(false);
        expect(items[0]?.output.textContent).toContain("暂不可用");
        items[0]?.retry.dispatchEvent(new Event("click"));
        await settle();
        expect(items[0]?.retry.hidden).toBe(true);
        cleanup?.();
        expect(remove).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
        const count = fetcher.mock.calls.length;
        items[0]?.retry.dispatchEvent(new Event("click"));
        await settle();
        expect(fetcher).toHaveBeenCalledTimes(count);
    });
    it("cleans up across Astro navigation and repeated page loads", async () => {
        const { doc, fetcher, mountWeather, visible, observers } = await browserWeather();
        const { registerPageLifecycle } = await import("../src/scripts/page-runtime");
        const unregister = registerPageLifecycle("weather-test", mountWeather, {
            host: {},
            target: doc,
            queueTask: (callback) => callback(),
        });
        doc.dispatchEvent(new Event("astro:page-load"));
        visible(0, true);
        await settle();
        doc.dispatchEvent(new Event("astro:before-swap"));
        expect(vi.getTimerCount()).toBe(0);
        doc.dispatchEvent(new Event("astro:page-load"));
        doc.dispatchEvent(new Event("astro:page-load"));
        visible(observers.length - 1, true);
        await settle();
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(1);
        unregister();
        expect(vi.getTimerCount()).toBe(0);
    });
    it("supports missing IntersectionObserver and empty routes", async () => {
        const { mountWeather, doc, fetcher } = await browserWeather();
        vi.stubGlobal("IntersectionObserver", undefined);
        const cleanup = mountWeather();
        await settle();
        expect(fetcher).toHaveBeenCalledTimes(2);
        cleanup?.();
        doc.querySelectorAll.mockReturnValue([]);
        expect(mountWeather()).toBeUndefined();
    });
});
