import { afterEach, describe, expect, it, vi } from "vitest";
import { initTocScrollSpy } from "../src/utils/toc-scrollspy";

afterEach(() => vi.unstubAllGlobals());

describe("TOC observer candidates", () => {
    it("reads visible candidates only, preserves DOM priority and cleans up", () => {
        let callback: IntersectionObserverCallback = () => {};
        let frame: FrameRequestCallback | undefined;
        const disconnect = vi.fn();
        class Observer {
            constructor(cb: IntersectionObserverCallback) {
                callback = cb;
            }
            observe() {}
            disconnect = disconnect;
        }
        const headings = Array.from({ length: 100 }, (_, index) => ({
            id: `heading-${index}`,
            getBoundingClientRect: vi.fn(() => {
                const top =
                    index < 50
                        ? (index - 50) * 100
                        : index <= 51
                          ? (index - 50) * 100 + 100
                          : 1000 + index * 100;
                return { top, bottom: top + 30 };
            }),
            scrollIntoView: vi.fn(),
        }));
        const links = headings.map((heading) =>
            Object.assign(new EventTarget(), {
                getAttribute: () => `#${heading.id}`,
                closest: () => null,
                classList: { add: vi.fn(), remove: vi.fn() },
                scrollIntoView: vi.fn(),
            }),
        );
        vi.stubGlobal("document", {
            querySelectorAll: () => links,
            getElementById: (id: string) => headings.find((heading) => heading.id === id),
        });
        vi.stubGlobal("window", { innerHeight: 1000 });
        vi.stubGlobal("IntersectionObserver", Observer);
        vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
            frame = cb;
            return 1;
        });
        const cancel = vi.fn();
        vi.stubGlobal("cancelAnimationFrame", cancel);
        const cleanup = initTocScrollSpy("active");
        const emit = (entries: Array<[number, boolean]>) => {
            callback(
                entries.map(([index, isIntersecting]) => ({
                    target: headings[index],
                    isIntersecting,
                })) as unknown as IntersectionObserverEntry[],
                {} as IntersectionObserver,
            );
        };
        emit([
            [51, true],
            [50, true],
        ]);
        frame?.(0);
        expect(links[50]?.classList.add).toHaveBeenCalledWith("active");
        expect(
            headings.reduce(
                (sum, heading) => sum + heading.getBoundingClientRect.mock.calls.length,
                0,
            ),
        ).toBeLessThanOrEqual(2);
        emit([[50, false]]);
        frame?.(0);
        expect(links[51]?.classList.add).toHaveBeenCalledWith("active");
        expect(links[50]?.classList.remove).toHaveBeenCalledWith("active");
        emit([[51, false]]);
        cleanup?.();
        expect(cancel).toHaveBeenCalledWith(1);
        expect(disconnect).toHaveBeenCalledOnce();
    });
});

it("keeps directory tracking inside its scroll pane and leaves anchor clicks to Swup", () => {
    let observerCallback: IntersectionObserverCallback = () => {};
    let tick: FrameRequestCallback = () => {};
    const pane = {
        scrollTop: 200,
        getBoundingClientRect: () => ({ top: 20, bottom: 300 }),
        scrollTo: vi.fn(),
    };
    const sidebar = Object.assign(new EventTarget(), { closest: () => pane });
    const heading = { id: "part", getBoundingClientRect: () => ({ top: 50, bottom: 80 }) };
    const link = Object.assign(new EventTarget(), {
        getAttribute: () => "#part",
        closest: () => sidebar,
        classList: { add: vi.fn(), remove: vi.fn() },
        getBoundingClientRect: () => ({ top: 350, bottom: 380 }),
        scrollIntoView: vi.fn(),
    });
    const listener = vi.spyOn(link, "addEventListener");
    vi.stubGlobal("document", { querySelectorAll: () => [link], getElementById: () => heading });
    vi.stubGlobal("window", { innerHeight: 1000, matchMedia: () => ({ matches: false }) });
    vi.stubGlobal(
        "IntersectionObserver",
        class {
            constructor(cb: IntersectionObserverCallback) {
                observerCallback = cb;
            }
            observe() {}
            disconnect() {}
        },
    );
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
        tick = cb;
        return 1;
    });
    const cleanup = initTocScrollSpy("active");
    observerCallback(
        [{ target: heading, isIntersecting: true }] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
    );
    tick(0);
    expect(pane.scrollTo).toHaveBeenCalledWith({ top: 280, behavior: "smooth" });
    expect(link.scrollIntoView).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
    cleanup?.();
});
