vi.mock("../src/scripts/route-out", () => ({ animateRouteOut: vi.fn(async () => () => {}) }));

import type { Options as ScrollOptions } from "@swup/scroll-plugin";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteMotion, RouteMotionEvent } from "../src/scripts/route-motion";

type Hook = (...args: unknown[]) => unknown;
type AnimationOptions = { animations: { in: Hook; out: Hook }[] };
type RouterOptions = {
    native: boolean;
    containers: string[];
    animationSelector: boolean;
    ignoreVisit: (href: string, options: { el?: Anchor }) => boolean;
};

const state = vi.hoisted(() => ({
    hooks: new Map<string, Hook>(),
    hookPriorities: new Map<string, number>(),
    options: undefined as RouterOptions | undefined,
    animationOptions: undefined as AnimationOptions | undefined,
    scrollOptions: undefined as Partial<ScrollOptions> | undefined,
    cache: new Map<string, object>(),
    order: [] as string[],
    fontReady: Promise.resolve(),
    scriptsReady: Promise.resolve(),
    prepareFonts: vi.fn(),
    prepareScripts: vi.fn(),
    executeScripts: vi.fn(),
    backToTop: vi.fn(),
    restoreContainers: vi.fn(),
    cachePositions: vi.fn(),
    navigate: vi.fn(),
    constructors: vi.fn(),
    currentVisit: undefined as unknown,
}));

vi.mock("swup", () => ({
    default: class {
        constructor(options: RouterOptions) {
            state.options = options;
            state.constructors();
        }
        hooks = {
            on: (name: string, hook: Hook) => {
                state.hookPriorities.set(`on:${name}`, 0);
                state.hooks.set(`on:${name}`, hook);
            },
            before: (name: string, hook: Hook, options?: { priority?: number }) => {
                state.hookPriorities.set(`before:${name}`, options?.priority ?? 0);
                state.hooks.set(`before:${name}`, hook);
            },
            replace: (name: string, hook: Hook) => state.hooks.set(`replace:${name}`, hook),
        };
        cache = {
            all: state.cache,
            get size() {
                return state.cache.size;
            },
            delete: (key: string) => state.cache.delete(key),
        };
        navigate = state.navigate;
        get visit() {
            return state.currentVisit;
        }
    },
}));
vi.mock("@swup/head-plugin", () => ({ default: class {} }));
vi.mock("@swup/preload-plugin", () => ({ default: class {} }));
vi.mock("@swup/a11y-plugin", () => ({ default: class {} }));
vi.mock("@swup/js-plugin", () => ({
    default: class {
        constructor(options: AnimationOptions) {
            state.animationOptions = options;
        }
    },
}));
vi.mock("@swup/scroll-plugin", () => ({
    default: class {
        constructor(options: Partial<ScrollOptions>) {
            state.scrollOptions = options;
        }
        getCachedScrollPositions = state.cachePositions;
        restoreScrollContainers = state.restoreContainers;
    },
}));
vi.mock("../src/scripts/back-to-top", () => ({ installBackToTop: state.backToTop }));
vi.mock("../src/scripts/navigation-font", () => ({
    prepareNavigationFont: async (...args: unknown[]) => {
        state.prepareFonts(...args);
        state.order.push("font-start");
        await state.fontReady;
        state.order.push("font-ready");
    },
}));
vi.mock("../src/scripts/navigation-scripts", () => ({
    prepareNavigationScripts: (...args: unknown[]) => {
        state.prepareScripts(...args);
        state.order.push("capture-scripts");
        return async (...executeArgs: unknown[]) => {
            state.executeScripts(...executeArgs);
            state.order.push("scripts-start");
            await state.scriptsReady;
            state.order.push("scripts-ready");
        };
    },
}));

class Anchor {
    focus = vi.fn();
    constructor(
        readonly href: string,
        readonly target: string | null = null,
        readonly ignored = false,
    ) {}
    getAttribute(name: string) {
        return name === "href" ? this.href : name === "target" ? this.target : null;
    }
    closest(selector: string) {
        return selector.includes("data-no-swup") && this.ignored ? this : null;
    }
}
const deferred = () => {
    let resolve = () => {};
    const promise = new Promise<void>((done) => {
        resolve = done;
    });
    return { promise, resolve };
};
const settle = async () => {
    for (let tick = 0; tick < 12; tick++) await Promise.resolve();
};
const hook = (kind: string, name: string, ...args: unknown[]) => {
    // Swup makes the incoming visit current before dispatching visit:start.
    if (kind === "on" && name === "visit:start") state.currentVisit = args[0];
    return state.hooks.get(`${kind}:${name}`)?.(...args);
};
function style(name: string) {
    return { name, remove: vi.fn(), isEqualNode: (other: { name: string }) => other.name === name };
}
function nextPage() {
    return {
        head: { querySelectorAll: () => [] as ReturnType<typeof style>[] },
        body: {
            attributes: [
                { name: "data-stalux-bg-index", value: "0" },
                { name: "data-stalux-bg-layer", value: "a" },
                { name: "data-stalux-site-title", value: "New site title" },
                { name: "class", value: "incoming-class" },
            ],
        },
    };
}
function visit(from = "/archives/", to = "/posts/new/", options = {}) {
    const navigation = {
        from: { url: from, hash: "" },
        to: { url: to, hash: "", document: nextPage() },
        history: { popstate: false, action: "push", direction: "forwards" },
        trigger: { el: undefined as Anchor | undefined },
        animation: { animate: true, wait: false },
        a11y: { focus: undefined as unknown },
        ignore: vi.fn(),
        done: false,
        abort: vi.fn(),
        ...options,
    };
    navigation.abort.mockImplementation(() => {
        navigation.done = true;
    });
    return navigation;
}

let install: typeof import("../src/scripts/swup-router").installSwupRouter;
let documentMock: EventTarget & {
    hidden: boolean;
    readyState: string;
    documentElement: { dataset: Record<string, string>; removeAttribute: ReturnType<typeof vi.fn> };
    body: { setAttribute: ReturnType<typeof vi.fn> };
    head: { querySelectorAll: () => ReturnType<typeof style>[] };
    activeElement: Anchor | null;
    querySelectorAll: () => Anchor[];
    querySelector: (selector: string) => unknown;
    startViewTransition: ReturnType<typeof vi.fn>;
};
let windowMock: EventTarget & {
    location: URL & { assign: ReturnType<typeof vi.fn> };
    history: { state: { index: number } };
    scrollX: number;
    scrollY: number;
    scrollTo: ReturnType<typeof vi.fn>;
    innerWidth: number;
    innerHeight: number;
    matchMedia: (query: string) => { matches: boolean };
};
let heading: {
    isConnected: boolean;
    hasAttribute: (name: string) => boolean;
    getBoundingClientRect: () => object;
    animate: ReturnType<typeof vi.fn>;
};
let article: {
    isConnected: boolean;
    getBoundingClientRect: () => object;
    closest: () => null;
    animate: ReturnType<typeof vi.fn>;
};
let sidebar: {
    isConnected: boolean;
    getBoundingClientRect: () => object;
    closest: (selector: string) => object | null;
    animate: ReturnType<typeof vi.fn>;
};
let reducedMotion: boolean;
let animationFinished: ReturnType<typeof deferred>;

beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    state.hooks.clear();
    state.hookPriorities.clear();
    state.cache.clear();
    state.currentVisit = undefined;
    state.scrollOptions = undefined;
    state.order.length = 0;
    state.fontReady = Promise.resolve();
    state.scriptsReady = Promise.resolve();
    state.cachePositions.mockReturnValue(undefined);
    reducedMotion = false;
    animationFinished = deferred();
    heading = {
        isConnected: true,
        hasAttribute: () => true,
        getBoundingClientRect: () => ({
            width: 300,
            height: 50,
            top: 100,
            bottom: 150,
            left: 0,
            right: 300,
        }),
        animate: vi.fn(() => ({ finished: animationFinished.promise, cancel: vi.fn() })),
    };
    // Article layout: a persisted sidebar plus the middle column. The route cue
    // must land on the column and leave the sidebar alone.
    article = {
        isConnected: true,
        getBoundingClientRect: () => ({
            width: 800,
            height: 4000,
            top: 0,
            bottom: 4000,
            left: 200,
            right: 1000,
        }),
        closest: () => null,
        animate: vi.fn(() => ({ finished: animationFinished.promise, cancel: vi.fn() })),
    };
    sidebar = {
        isConnected: true,
        getBoundingClientRect: () => ({
            width: 200,
            height: 900,
            top: 0,
            bottom: 900,
            left: 0,
            right: 200,
        }),
        closest: (selector: string) => (selector === "[data-swup-persist]" ? {} : null),
        animate: vi.fn(),
    };
    const main = {
        isConnected: true,
        getBoundingClientRect: () => ({
            width: 1000,
            height: 4000,
            top: 0,
            bottom: 4000,
            left: 0,
            right: 1000,
        }),
        querySelector: (selector: string) => {
            if (selector === "article.stalux-article") return article;
            if (selector === "[data-swup-persist]") return sidebar;
            return null;
        },
        querySelectorAll: (selector: string) =>
            selector === "[data-stalux-motion-content]" ? [sidebar, article] : [],
    };
    documentMock = Object.assign(new EventTarget(), {
        hidden: false,
        readyState: "interactive",
        documentElement: { dataset: {} as Record<string, string>, removeAttribute: vi.fn() },
        body: { setAttribute: vi.fn() },
        head: { querySelectorAll: () => [] as ReturnType<typeof style>[] },
        activeElement: null as Anchor | null,
        querySelectorAll: () => [] as Anchor[],
        querySelector: (selector: string) => {
            if (selector === "main[data-stalux-route]") return main;
            if (selector === "[data-stalux-motion-focus]") return heading;
            return null;
        },
        startViewTransition: vi.fn(),
    });
    windowMock = Object.assign(new EventTarget(), {
        location: Object.assign(new URL("https://example.com/archives/"), { assign: vi.fn() }),
        history: { state: { index: 1 } },
        scrollX: 0,
        scrollY: 0,
        scrollTo: vi.fn(),
        innerWidth: 1440,
        innerHeight: 900,
        matchMedia: (query: string) => ({
            matches: query.includes("reduced-motion") && reducedMotion,
        }),
    });
    vi.stubGlobal("document", documentMock);
    vi.stubGlobal("window", windowMock);
    vi.stubGlobal("HTMLAnchorElement", Anchor);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
    });
    ({ installSwupRouter: install } = await import("../src/scripts/swup-router"));
});
afterEach(() => vi.unstubAllGlobals());

describe("Swup navigation bridge and persistent shell", () => {
    it("installs one router at parsed-document timing and disables native snapshots", async () => {
        const firstLoad = vi.fn();
        documentMock.addEventListener("astro:page-load", firstLoad);
        const router = install();
        expect(install()).toBe(router);
        await settle();
        expect(state.constructors).toHaveBeenCalledOnce();
        expect(state.backToTop).toHaveBeenCalledOnce();
        expect(state.options).toMatchObject({
            native: false,
            containers: ["main[data-stalux-route]"],
            animationSelector: false,
        });
        expect(firstLoad).toHaveBeenCalledOnce();
        expect(documentMock.documentElement.dataset.staluxRouter).toBe("swup");
        expect(documentMock.startViewTransition).not.toHaveBeenCalled();
    });

    it("sets animation.wait synchronously before a canceled startup can skip its context handler", async () => {
        install();
        await settle();
        const navigation = visit();
        const preparing = vi.fn();
        documentMock.addEventListener("astro:before-preparation", preparing);
        expect(state.hookPriorities.get("before:visit:start")).toBe(-1000);
        expect(state.hookPriorities.get("on:visit:start")).toBe(0);
        const result = hook("before", "visit:start", navigation);
        expect(result).toBeUndefined();
        expect(navigation.animation.wait).toBe(true);
        // An intervening click can skip on:visit:start entirely. The old page
        // load must still settle before the missing-context guard aborts it.
        hook("before", "visit:transition", navigation);
        expect(preparing).not.toHaveBeenCalled();
        expect(navigation.abort).toHaveBeenCalledOnce();
        expect(navigation.done).toBe(true);
        expect(navigation.animation.wait).toBe(true);
    });

    it("performs fifty instant scrolls without retaining wheel or scrollend listeners", async () => {
        install();
        await settle();
        const scroll = state.scrollOptions?.scrollFunction;
        if (!scroll) throw new Error("Missing custom ScrollPlugin scrollFunction");
        expect(state.scrollOptions?.animateScroll).toEqual({
            betweenPages: false,
            samePageWithHash: true,
            samePage: true,
        });
        const order: string[] = [];
        const element = Object.assign(new EventTarget(), {
            scrollTo: vi.fn(() => order.push("scroll")),
        });
        const elementListeners = vi.spyOn(element, "addEventListener");
        const windowListeners = vi.spyOn(windowMock, "addEventListener");
        const start = vi.fn(() => order.push("start"));
        const end = vi.fn(() => order.push("end"));
        for (let index = 0; index < 50; index++) {
            // Include no-op top visits, repeated anchors and nonzero offsets.
            const top = index % 2 === 0 ? 0 : 2400 + index;
            const left = index % 3;
            scroll(element as unknown as Element, top, left, false, start, end);
            expect(element.scrollTo).toHaveBeenNthCalledWith(index + 1, {
                top,
                left,
                behavior: "instant",
            });
        }
        expect(start).toHaveBeenCalledTimes(50);
        expect(end).toHaveBeenCalledTimes(50);
        expect(order).toEqual(Array.from({ length: 50 }, () => ["start", "scroll", "end"]).flat());
        expect(windowMock.scrollTo).not.toHaveBeenCalled();
        expect(elementListeners).not.toHaveBeenCalled();
        expect(windowListeners).not.toHaveBeenCalled();
    });

    it("awaits fonts and scripts around swap and shares real animation completion with consumers", async () => {
        install();
        await settle();
        state.order.length = 0;
        const fonts = deferred();
        const scripts = deferred();
        state.fontReady = fonts.promise;
        state.scriptsReady = scripts.promise;
        let shared: RouteMotion | undefined;
        const { prepareRouteMotion } = await import("../src/scripts/route-motion");
        for (const name of [
            "before-preparation",
            "after-preparation",
            "before-swap",
            "after-swap",
            "page-load",
        ]) {
            documentMock.addEventListener(`astro:${name}`, (event) => {
                state.order.push(name);
                if (name === "before-swap") shared = prepareRouteMotion(event as RouteMotionEvent);
            });
        }
        const navigation = visit();
        hook("on", "visit:start", navigation);
        const preparing = hook("before", "content:replace", navigation);
        expect(state.order).toEqual(["before-preparation", "capture-scripts", "font-start"]);
        fonts.resolve();
        await preparing;
        expect(state.order).toContain("after-preparation");
        let replaced = false;
        const replacing = Promise.resolve(
            hook("replace", "content:replace", navigation, {}, async () => {
                state.order.push("swap");
            }),
        ).then(() => {
            replaced = true;
        });
        await settle();
        expect(state.order).toContain("scripts-start");
        expect(replaced).toBe(true);
        let ready = false;
        let finished = false;
        void shared?.ready.then(() => {
            ready = true;
        });
        void shared?.finished.then(() => {
            finished = true;
        });
        await settle();
        expect(ready).toBe(false);
        article.animate.mockImplementation(() => {
            state.order.push("animate");
            return { finished: animationFinished.promise, cancel: vi.fn() };
        });
        await hook("replace", "content:scroll", navigation, {}, async () => {
            state.order.push("scroll");
        });
        const viewing = hook("on", "page:view", navigation);
        await settle();
        expect(ready).toBe(true);
        expect(state.order).not.toContain("page-load");
        scripts.resolve();
        await replacing;
        await viewing;
        const incoming = state.animationOptions?.animations[0]?.in(undefined, {
            visit: navigation,
        });
        await settle();
        expect(ready).toBe(true);
        expect(finished).toBe(false);
        expect(article.animate).toHaveBeenCalledWith(
            { opacity: [0, 1], transform: ["translate3d(0, 56px, 0)", "translate3d(0, 0, 0)"] },
            { duration: 340, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "both" },
        );
        // The persisted sidebars belong to the shell, not to the route cue.
        expect(sidebar.animate).not.toHaveBeenCalled();
        expect(heading.animate).not.toHaveBeenCalled();
        animationFinished.resolve();
        await incoming;
        expect(finished).toBe(true);
        expect(state.order).toEqual([
            "before-preparation",
            "capture-scripts",
            "font-start",
            "font-ready",
            "after-preparation",
            "before-swap",
            "swap",
            "after-swap",
            "scripts-start",
            "scroll",
            "animate",
            "scripts-ready",
            "page-load",
        ]);
        expect(state.prepareScripts).toHaveBeenCalledWith(navigation.to.document, {
            baseUrl: "https://example.com/posts/new/",
        });
        expect(documentMock.startViewTransition).not.toHaveBeenCalled();
    });

    it("keeps live background state and prunes only obsolete authored styles", async () => {
        const old = style("old");
        const kept = style("kept");
        const runtime = style("runtime-sdk");
        documentMock.head.querySelectorAll = () => [old, kept];
        install();
        await settle();
        const navigation = visit();
        navigation.to.document.head.querySelectorAll = () => [style("kept")];
        documentMock.head.querySelectorAll = () => [old, kept, runtime];
        hook("on", "visit:start", navigation);
        await hook("before", "content:replace", navigation);
        await hook("replace", "content:replace", navigation, {}, async () => {});
        expect(old.remove).toHaveBeenCalledOnce();
        expect(kept.remove).not.toHaveBeenCalled();
        expect(runtime.remove).not.toHaveBeenCalled();
        expect(documentMock.body.setAttribute).toHaveBeenCalledExactlyOnceWith(
            "data-stalux-site-title",
            "New site title",
        );
    });

    it.each(["visit:abort", "visit:fail"])(
        "settles shared gates and removes busy state on %s",
        async (reason) => {
            install();
            await settle();
            let shared: RouteMotion | undefined;
            let signal: AbortSignal | undefined;
            const { prepareRouteMotion } = await import("../src/scripts/route-motion");
            documentMock.addEventListener("astro:before-swap", (event) => {
                shared = prepareRouteMotion(event as RouteMotionEvent);
                signal = (event as Event & { signal: AbortSignal }).signal;
            });
            const navigation = visit();
            hook("on", "visit:start", navigation);
            await hook("before", "content:replace", navigation);
            await hook("replace", "content:replace", navigation, {}, async () => {});
            hook("on", reason, navigation);
            await Promise.all([shared?.ready, shared?.finished]);
            expect(signal?.aborted).toBe(true);
            expect(documentMock.documentElement.dataset.staluxVtPreset).toBeUndefined();
            expect(documentMock.documentElement.removeAttribute).toHaveBeenCalledWith("aria-busy");
            hook("on", "page:view", navigation);
            expect(article.animate).not.toHaveBeenCalled();
            expect(sidebar.animate).not.toHaveBeenCalled();
        },
    );

    it("does not dispatch late preparation or page-load after cancellation during an await", async () => {
        install();
        await settle();
        const afterPreparation = vi.fn();
        const pageLoad = vi.fn();
        documentMock.addEventListener("astro:after-preparation", afterPreparation);
        documentMock.addEventListener("astro:page-load", pageLoad);
        const fonts = deferred();
        state.fontReady = fonts.promise;
        const first = visit();
        hook("on", "visit:start", first);
        const preparation = hook("before", "content:replace", first);
        hook("on", "visit:abort", first);
        fonts.resolve();
        await preparation;
        expect(afterPreparation).not.toHaveBeenCalled();

        state.fontReady = Promise.resolve();
        const scripts = deferred();
        state.scriptsReady = scripts.promise;
        const second = visit();
        hook("on", "visit:start", second);
        await hook("before", "content:replace", second);
        await hook("replace", "content:replace", second, {}, async () => {});
        const viewing = hook("on", "page:view", second);
        hook("on", "visit:abort", second);
        scripts.resolve();
        await viewing;
        expect(pageLoad).not.toHaveBeenCalled();
    });

    it.each(["aborted", "done", "superseded"])(
        "ignores a released document from an obsolete %s visit without triggering fallback",
        async (mode) => {
            install();
            await settle();
            const beforeSwap = vi.fn();
            const afterPreparation = vi.fn();
            const updateHead = vi.fn();
            documentMock.addEventListener("astro:before-swap", beforeSwap);
            documentMock.addEventListener("astro:after-preparation", afterPreparation);
            const navigation = visit();
            const fonts = deferred();
            state.fontReady = fonts.promise;
            hook("on", "visit:start", navigation);
            const preparing = hook("before", "content:replace", navigation);
            if (mode === "aborted") hook("on", "visit:abort", navigation);
            else if (mode === "done") Object.assign(navigation, { done: true });
            else hook("on", "visit:start", visit("/archives/", "/tags/"));
            // Swup releases a stale parsed document before its awaiting hook
            // chain resumes. This must not become "Missing Swup document".
            Reflect.deleteProperty(navigation.to, "document");
            fonts.resolve();
            await preparing;
            // Swup Hooks.run checks visit.done between handlers. The early
            // bridge must abort the whole chain, before HeadPlugin's handler.
            if (!navigation.done) updateHead();
            expect(updateHead).not.toHaveBeenCalled();
            if (mode !== "done") {
                expect(navigation.abort).toHaveBeenCalledOnce();
                expect(afterPreparation).not.toHaveBeenCalled();
            }
            const replace = vi.fn();
            await expect(
                Promise.resolve(hook("replace", "content:replace", navigation, {}, replace)),
            ).resolves.toBeUndefined();
            expect(replace).not.toHaveBeenCalled();
            expect(beforeSwap).not.toHaveBeenCalled();
            expect(state.executeScripts).not.toHaveBeenCalled();
        },
    );

    it.each(["unknown-context", "aborted", "superseded"])(
        "aborts a stale %s visit before head metadata or default replacement can run",
        async (mode) => {
            install();
            await settle();
            const navigation = visit();
            const afterPreparation = vi.fn();
            documentMock.addEventListener("astro:after-preparation", afterPreparation);
            if (mode !== "unknown-context") hook("on", "visit:start", navigation);
            if (mode === "aborted") hook("on", "visit:abort", navigation);
            if (mode === "superseded") hook("on", "visit:start", visit("/archives/", "/tags/"));
            const updateHead = vi.fn();
            const replace = vi.fn();
            await hook("before", "content:replace", navigation);
            if (!navigation.done) updateHead();
            if (!navigation.done) await hook("replace", "content:replace", navigation, {}, replace);
            expect(navigation.abort).toHaveBeenCalledOnce();
            expect(navigation.done).toBe(true);
            expect(state.prepareFonts).not.toHaveBeenCalled();
            expect(afterPreparation).not.toHaveBeenCalled();
            expect(updateHead).not.toHaveBeenCalled();
            expect(replace).not.toHaveBeenCalled();
        },
    );

    it("still reports a missing document for the active uncanceled visit", async () => {
        install();
        await settle();
        const navigation = visit();
        hook("on", "visit:start", navigation);
        Reflect.deleteProperty(navigation.to, "document");
        const replace = vi.fn();
        await expect(
            Promise.resolve(hook("replace", "content:replace", navigation, {}, replace)),
        ).rejects.toThrow("Missing Swup document");
        expect(replace).not.toHaveBeenCalled();
    });

    it.each(["unknown-context", "aborted", "superseded"])(
        "aborts a stale %s visit before renderPage can change history or location",
        async (mode) => {
            install();
            await settle();
            const navigation = visit();
            if (mode !== "unknown-context") hook("on", "visit:start", navigation);
            if (mode === "aborted") hook("on", "visit:abort", navigation);
            if (mode === "superseded") hook("on", "visit:start", visit("/archives/", "/tags/"));
            const originalHref = windowMock.location.href;
            const renderUrl = vi.fn(() => {
                windowMock.location.href = new URL(navigation.to.url, originalHref).href;
                windowMock.history.state.index = 2;
            });
            await hook("before", "visit:transition", navigation);
            // Core renderPage is the default visit:transition handler and
            // updates history before content:replace. Hooks.run skips it once
            // the early guard sets visit.done via abort().
            if (!navigation.done) renderUrl();
            expect(navigation.abort).toHaveBeenCalledOnce();
            expect(navigation.done).toBe(true);
            expect(renderUrl).not.toHaveBeenCalled();
            expect(windowMock.location.href).toBe(originalHref);
            expect(windowMock.history.state.index).toBe(1);
        },
    );

    it("allows the current valid visit to render its URL after the transition guard", async () => {
        install();
        await settle();
        const navigation = visit();
        hook("on", "visit:start", navigation);
        const renderUrl = vi.fn(() => {
            windowMock.location.href = new URL(navigation.to.url, windowMock.location.href).href;
        });
        await hook("before", "visit:transition", navigation);
        if (!navigation.done) renderUrl();
        expect(navigation.abort).not.toHaveBeenCalled();
        expect(navigation.done).toBe(false);
        expect(renderUrl).toHaveBeenCalledOnce();
        expect(windowMock.location.pathname).toBe("/posts/new/");
    });

    it("does not let an old abort or completion clear a newer route's state", async () => {
        install();
        await settle();
        const first = visit();
        hook("on", "visit:start", first);
        await hook("before", "content:replace", first);
        await hook("replace", "content:replace", first, {}, async () => {});
        const second = visit("/posts/new/", "/tags/");
        hook("on", "visit:start", second);
        await hook("before", "content:replace", second);
        await hook("replace", "content:replace", second, {}, async () => {});
        hook("on", "visit:abort", first);
        hook("on", "visit:end", first);
        expect(documentMock.documentElement.dataset.staluxVtTo).toBe("tags-index");
        expect(documentMock.documentElement.removeAttribute).not.toHaveBeenCalled();
        hook("on", "visit:abort", second);
        expect(documentMock.documentElement.dataset.staluxVtTo).toBeUndefined();
    });

    it.each(["/archives/", "/archives/#year"])(
        "skips same-URL and hash decoration: %s",
        async (destination) => {
            install();
            await settle();
            const navigation = visit("/archives/", destination);
            hook("on", "visit:start", navigation);
            await hook("before", "content:replace", navigation);
            await hook("replace", "content:replace", navigation, {}, async () => {});
            await state.animationOptions?.animations[0]?.in(undefined, { visit: navigation });
            expect(documentMock.documentElement.dataset.staluxVtPreset).toBe("none");
            expect(article.animate).not.toHaveBeenCalled();
            expect(sidebar.animate).not.toHaveBeenCalled();
            expect(hook("replace", "link:self", navigation)).toBeUndefined();
        },
    );

    it.each([false, true])(
        "restores history scroll and focus with reduced motion %s",
        async (reduced) => {
            install();
            await settle();
            const originalLink = new Anchor("/posts/old/");
            documentMock.activeElement = originalLink;
            documentMock.querySelectorAll = () => [originalLink];
            windowMock.scrollY = 4800;
            windowMock.scrollX = 8;
            const forward = visit();
            hook("on", "visit:start", forward);
            windowMock.history.state.index = 2;
            await hook("before", "content:replace", forward);
            await hook("replace", "content:replace", forward, {}, async () => {});
            windowMock.scrollY = 0;
            windowMock.scrollX = 0;
            windowMock.history.state.index = 1;
            reducedMotion = reduced;
            const back = visit("/posts/new/", "/archives/", {
                history: { popstate: true, action: "push", direction: "backwards" },
            });
            hook("on", "visit:start", back);
            await hook("before", "content:replace", back);
            await hook("replace", "content:replace", back, {}, async () => {});
            await hook("replace", "content:scroll", back, {}, vi.fn());
            expect(windowMock.scrollTo).toHaveBeenCalledExactlyOnceWith({
                top: 4800,
                left: 8,
                behavior: "instant",
            });
            expect(originalLink.focus).toHaveBeenCalledWith({ preventScroll: true });
            expect(back.a11y.focus).toBe(false);
            expect(documentMock.documentElement.dataset.staluxVtPreset).toBe(
                reduced ? "none" : "restore",
            );
        },
    );

    it("skips extra motion for native history gestures and settles unanimated visits", async () => {
        install();
        await settle();
        windowMock.dispatchEvent(
            Object.assign(new Event("popstate"), { hasUAVisualTransition: true }),
        );
        const navigation = visit("/posts/new/", "/archives/", {
            history: { popstate: true, action: "push", direction: "backwards" },
            animation: { animate: false, wait: false },
        });
        hook("on", "visit:start", navigation);
        await hook("before", "content:replace", navigation);
        await hook("replace", "content:replace", navigation, {}, async () => {});
        hook("on", "page:view", navigation);
        await state.animationOptions?.animations[0]?.in(undefined, { visit: navigation });
        expect(documentMock.documentElement.dataset.staluxVtPreset).toBe("none");
        expect(article.animate).not.toHaveBeenCalled();
        expect(sidebar.animate).not.toHaveBeenCalled();
        hook("on", "visit:end", navigation);
        expect(documentMock.documentElement.dataset.staluxVtPreset).toBeUndefined();
    });

    it("falls back for standalone assets and explicit native intent", async () => {
        install();
        await settle();
        const ignore = state.options?.ignoreVisit;
        for (const path of [
            "/standalone.html",
            "/rss.xml",
            "/posts/a.md",
            "/api/posts.json",
            "/image.svg",
        ])
            expect(ignore?.(path, {})).toBe(true);
        expect(ignore?.("/archives/", { el: new Anchor("/archives/", "_blank") })).toBe(true);
        expect(ignore?.("/archives/", { el: new Anchor("/archives/", null, true) })).toBe(true);
        expect(ignore?.("/archives/", { el: new Anchor("/archives/") })).toBe(false);
        const { navigate } = await import("../src/scripts/navigation-client");
        navigate("/tags/");
        expect(state.navigate).toHaveBeenCalledWith("/tags/");
    });

    it("honors preparation cancellation and bounds the response cache", async () => {
        install();
        await settle();
        documentMock.addEventListener("astro:before-preparation", (event) =>
            event.preventDefault(),
        );
        const navigation = visit();
        hook("on", "visit:start", navigation);
        expect(navigation.ignore).toHaveBeenCalledOnce();
        for (let index = 0; index < 40; index++) state.cache.set(`/page-${index}`, {});
        hook("on", "cache:set");
        expect(state.cache.size).toBe(32);
        expect(state.cache.has("/page-0")).toBe(false);
        expect(state.cache.has("/page-39")).toBe(true);
    });
});
