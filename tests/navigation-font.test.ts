import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let prepareNavigationFont: typeof import("../src/scripts/navigation-font").prepareNavigationFont;
beforeEach(async () => {
    vi.resetModules();
    ({ prepareNavigationFont } = await import("../src/scripts/navigation-font"));
});

const nextPage = (href: string | null) =>
    ({
        querySelector: () => (href === null ? null : { getAttribute: () => href }),
    }) as unknown as Document;

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

function mockFace(load: () => Promise<unknown>) {
    vi.stubGlobal("window", { location: new URL("https://example.com/blog/") });
    const faceConstructor = vi.fn(
        class {
            load = load;
        },
    );
    vi.stubGlobal("FontFace", faceConstructor);
    return faceConstructor;
}

describe("navigation font preparation", () => {
    it("warms the destination font without installing a face in the active document", async () => {
        const load = vi.fn().mockResolvedValue(undefined);
        const face = mockFace(load);
        await prepareNavigationFont(
            nextPage("/blog/_astro/fonts/page-a.woff2"),
            new AbortController().signal,
        );
        expect(face).toHaveBeenCalledWith(
            "LXGW WenKai-Page Subset",
            'url("https://example.com/blog/_astro/fonts/page-a.woff2")',
            { style: "normal", weight: "100 900" },
        );
        expect(load).toHaveBeenCalledOnce();
    });

    it("skips missing, external and aborted fonts", async () => {
        const face = mockFace(vi.fn());
        const controller = new AbortController();
        await prepareNavigationFont(nextPage(null), controller.signal);
        await prepareNavigationFont(
            nextPage("https://other.example/font.woff2"),
            controller.signal,
        );
        controller.abort();
        await prepareNavigationFont(nextPage("/font.woff2"), controller.signal);
        expect(face).not.toHaveBeenCalled();
    });

    it("continues after load failure, timeout or superseding navigation", async () => {
        vi.useFakeTimers();
        mockFace(() => Promise.reject(new Error("missing font")));
        await expect(
            prepareNavigationFont(nextPage("/font.woff2"), new AbortController().signal),
        ).resolves.toBeUndefined();
        mockFace(() => new Promise(() => {}));
        const timed = prepareNavigationFont(nextPage("/font.woff2"), new AbortController().signal);
        await vi.advanceTimersByTimeAsync(150);
        await expect(timed).resolves.toBeUndefined();
        const controller = new AbortController();
        const aborted = prepareNavigationFont(nextPage("/font.woff2"), controller.signal);
        controller.abort();
        await expect(aborted).resolves.toBeUndefined();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("shares pending loads and revisits without installing or reloading a face", async () => {
        vi.useFakeTimers();
        const load = vi.fn(() => new Promise(() => {}));
        const face = mockFace(load);
        const first = prepareNavigationFont(
            nextPage("/shared.woff2"),
            new AbortController().signal,
        );
        const second = prepareNavigationFont(
            nextPage("/shared.woff2"),
            new AbortController().signal,
        );
        await vi.advanceTimersByTimeAsync(150);
        await Promise.all([first, second]);
        expect(face).toHaveBeenCalledOnce();
        expect(load).toHaveBeenCalledOnce();
    });

    it("evicts old faces, retries failures and tolerates malformed URLs", async () => {
        const load = vi
            .fn()
            .mockRejectedValueOnce(new Error("offline"))
            .mockResolvedValue(undefined);
        const face = mockFace(load);
        const signal = new AbortController().signal;
        await prepareNavigationFont(nextPage("http://[invalid"), signal);
        expect(face).not.toHaveBeenCalled();
        await prepareNavigationFont(nextPage("/retry.woff2"), signal);
        await prepareNavigationFont(nextPage("/retry.woff2"), signal);
        expect(load).toHaveBeenCalledTimes(2);
        for (let index = 0; index < 16; index++)
            await prepareNavigationFont(nextPage(`/page-${index}.woff2`), signal);
        await prepareNavigationFont(nextPage("/retry.woff2"), signal);
        expect(load).toHaveBeenCalledTimes(19);
    });
});
