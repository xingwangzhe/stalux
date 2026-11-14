// @vitest-environment happy-dom

/**
 * The routing layer is `@swup/astro`'s, so what is left to test is the three
 * guards the theme attaches to it plus the configuration it is handed.
 *
 * The fake below mirrors swup's hook API closely enough to drive the real
 * `route-guards` module: handlers run in priority order, `before` handlers run
 * ahead of `on` handlers, and a done visit skips the rest of its chain.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    SWUP_IGNORE_FILES,
    SWUP_IGNORE_UNKNOWN_ROUTES,
    SWUP_OPTIONS,
    SWUP_ROUTES,
} from "../src/internal/swup-options";
import { getRouteKind } from "../src/utils/public-routes";

interface FakeVisit {
    to: { url: string; hash?: string; route?: string; document?: Document };
    from: { url: string };
    history: { popstate: boolean; action: "push" | "replace"; direction?: string };
    trigger: Record<string, never>;
    animation: Record<string, unknown>;
    a11y: Record<string, unknown>;
    aborted: boolean;
    abort: () => void;
}

type Handler = (visit: FakeVisit, args?: unknown) => unknown;

function createVisit(url = "/archives", document?: Document): FakeVisit {
    const visit: FakeVisit = {
        to: { url, document },
        from: { url: "/" },
        history: { popstate: false, action: "push" },
        trigger: {},
        animation: {},
        a11y: {},
        aborted: false,
        abort: () => {
            visit.aborted = true;
        },
    };
    return visit;
}

function createHooks() {
    const before = new Map<string, Array<{ handler: Handler; priority: number; id: number }>>();
    const after = new Map<string, Array<{ handler: Handler; priority: number; id: number }>>();
    let lastId = 0;
    const register =
        (store: typeof before, kind: "before" | "on") =>
        (name: string, handler: Handler, options: { priority?: number } = {}) => {
            void kind;
            const list = store.get(name) ?? [];
            list.push({ handler, priority: options.priority ?? 0, id: ++lastId });
            store.set(name, list);
        };
    const run = async (store: typeof before, name: string, visit: FakeVisit, args?: unknown) => {
        const list = [...(store.get(name) ?? [])].sort(
            (a, b) => a.priority - b.priority || a.id - b.id,
        );
        for (const { handler } of list) {
            if (visit.aborted) continue;
            await handler(visit, args);
        }
    };
    return {
        before: register(before, "before"),
        on: register(after, "on"),
        async trigger(name: string, visit: FakeVisit, args?: unknown) {
            await run(before, name, visit, args);
            if (visit.aborted) return;
            await run(after, name, visit, args);
        },
        names() {
            return [...new Set([...before.keys(), ...after.keys()])].sort();
        },
    };
}

function createSwup(pages: string[] = []) {
    const hooks = createHooks();
    // What `@swup/astro` itself registers: its init script forwards the hook to
    // an Astro lifecycle event, so ordering against it is observable here.
    hooks.on("content:replace", () => {
        document.dispatchEvent(new Event("astro:after-swap"));
    });
    const cache = new Map(pages.map((url) => [url, { url, html: "" }]));
    const swup = {
        hooks,
        visit: createVisit(),
        cache: {
            get size() {
                return cache.size;
            },
            get all() {
                return cache;
            },
            delete: (url: string) => cache.delete(url),
        },
    };
    return swup;
}

type FakeSwup = ReturnType<typeof createSwup>;

async function setup(pages: string[] = []) {
    vi.resetModules();
    const guards = await import("../src/scripts/route-guards");
    const swup = createSwup(pages);
    (window as unknown as { swup?: FakeSwup }).swup = swup;
    guards.installRouteGuards();
    return { swup, guards };
}

function headStyles(document: Document): string[] {
    return [...document.head.querySelectorAll("style,link[rel=stylesheet]")].map(
        (element) => element.getAttribute("data-href") ?? element.getAttribute("href") ?? "",
    );
}

/**
 * Stand in for the head plugin: it adds the tags the incoming page declares and
 * keeps the ones it already knows, which is what the guard then prunes.
 */
function adoptHead(next: Document): void {
    for (const element of [...next.head.children]) {
        const known = [...document.head.children].some((live) => live.isEqualNode(element));
        if (!known) document.head.append(document.importNode(element, true));
    }
}

function incoming(head: string): Document {
    return new DOMParser().parseFromString(
        `<!doctype html><html><head>${head}</head><body><main id="swup-main"></main></body></html>`,
        "text/html",
    );
}

beforeEach(() => {
    // Style elements rather than link elements: happy-dom tries to fetch the
    // latter, and the guard compares whole nodes either way.
    document.head.innerHTML =
        '<style data-href="/_astro/shared.css">.shared{color:black}</style><style data-href="/_astro/page-a.css">.page-a{color:red}</style>';
    document.body.innerHTML = '<main id="swup-main"></main>';
});

afterEach(() => {
    delete (window as unknown as { swup?: FakeSwup }).swup;
    delete document.documentElement.dataset.staluxRoute;
});

describe("swup configuration handed to @swup/astro", () => {
    it("keeps the behaviour the theme depends on", () => {
        expect(SWUP_OPTIONS).toMatchObject({
            containers: ["#swup-main"],
            // No route animation at all: no theme, no animation class selector.
            theme: false,
            animationClass: false,
            // The first click must not beat the router's own initialisation.
            loadOnIdle: false,
            // route-prefetch and the guard script read the instance.
            globalInstance: true,
            // Page scripts are executed by the theme's own runner instead.
            reloadScripts: false,
            native: false,
        });
    });

    it("keeps old styles readable while the incoming sheet loads", () => {
        expect(SWUP_OPTIONS.updateHead).toMatchObject({
            awaitAssets: true,
            persistTags: "link[rel=stylesheet], script[src], style",
        });
    });

    it("names every themed route, with the same names the classifier uses", () => {
        const names = SWUP_ROUTES.map((route) => route.name).sort();
        expect(names).toEqual([
            "about",
            "archive",
            "article",
            "categories-detail",
            "categories-index",
            "home",
            "links",
            "not-found",
            "tags-detail",
            "tags-index",
            "words",
        ]);
        for (const route of SWUP_ROUTES) {
            const path = String(route.path)
                .replace(":post", "hello")
                .replace(":tag", "astro")
                .replace(":category", "code");
            expect(getRouteKind(path)).toBe(route.name);
        }
    });

    it("only claims theme pages and never real files", () => {
        const ignored = (path: string) =>
            SWUP_IGNORE_FILES.test(path) || SWUP_IGNORE_UNKNOWN_ROUTES.test(path);
        for (const path of [
            "/",
            "/archives",
            "/tags",
            "/tags/astro",
            "/categories",
            "/categories/code",
            "/posts/hello",
            "/posts/hello/",
            "/posts/hello?ref=1",
            "/posts/hello#footnotes",
            "/about",
            "/404",
        ]) {
            expect([path, ignored(path)]).toEqual([path, false]);
        }
        for (const path of [
            "/posts/hello.md",
            "/index.md",
            "/sitemap.xml",
            "/feed.json",
            "/pagefind/pagefind.js",
            "/_astro/page.css",
            "/assets/cover.avif",
            "/api/search",
            "/tagss",
        ]) {
            expect([path, ignored(path)]).toEqual([path, true]);
        }
    });
});

describe("route guards", () => {
    it("aborts a superseded visit at the transition boundary only", async () => {
        const { swup } = await setup();
        const current = createVisit("/posts/new");
        swup.visit = current;
        const stale = createVisit("/posts/old");

        await swup.hooks.trigger("visit:transition", stale);
        expect(stale.aborted).toBe(true);

        await swup.hooks.trigger("visit:transition", current);
        expect(current.aborted).toBe(false);
    });

    it("prunes the styles of the outgoing page and keeps everything shared", async () => {
        const { swup } = await setup();
        // Injected by a live SDK after the router booted, never by the theme.
        const sdk = document.createElement("style");
        sdk.textContent = ".sdk-widget{display:block}";
        document.head.append(sdk);
        const next = incoming(
            '<style data-href="/_astro/shared.css">.shared{color:black}</style><style data-href="/_astro/page-b.css">.page-b{color:blue}</style>',
        );
        const visit = createVisit("/posts/new", next);
        swup.visit = visit;
        adoptHead(next);
        await swup.hooks.trigger("content:replace", visit);

        // .page-a belonged to the outgoing page; .sdk-widget was injected by a
        // live SDK and is not authored by the theme, so it stays.
        expect(headStyles(document)).toEqual(["/_astro/shared.css", "", "/_astro/page-b.css"]);

        // On the next navigation the SDK style is no longer tracked, so it is
        // never pruned even though the new page does not declare it either.
        const third = incoming(
            '<style data-href="/_astro/page-c.css">.page-c{color:green}</style>',
        );
        const second = createVisit("/posts/third", third);
        swup.visit = second;
        adoptHead(third);
        await swup.hooks.trigger("content:replace", second);
        expect(headStyles(document)).toEqual(["", "/_astro/page-c.css"]);
    });

    it("installs the scripts of the incoming page before page-load", async () => {
        const { swup } = await setup();
        const next = incoming("<head></head>");
        next.body.innerHTML =
            '<main id="swup-main"><script data-probe="">window.__probe = 1;</script></main>';
        const visit = createVisit("/posts/new", next);
        swup.visit = visit;
        await swup.hooks.trigger("content:replace", visit);

        const probe = document.querySelector("script[data-probe]");
        expect(probe).not.toBeNull();
        // The bounce happened through the live document, not the parsed one.
        expect(probe?.ownerDocument).toBe(document);
        expect(document.querySelector("script[data-probe]")?.textContent).toContain(
            "window.__probe",
        );
    });

    it("refills retained shell slots from the incoming page", async () => {
        document.body.innerHTML = `
            <main id="swup-main"><article>
                <aside data-swup-persist="right">
                    <section data-stalux-shell-slot="toc"><a href="#old">old</a></section>
                </aside>
            </article></main>`;
        const { swup } = await setup();
        const next = incoming("");
        next.body.innerHTML = `<main id="swup-main"><article>
                <aside data-swup-persist="right">
                    <section data-stalux-shell-slot="toc"><a href="#new">new</a></section>
                </aside>
            </article></main>`;
        const visit = createVisit("/posts/new", next);
        swup.visit = visit;
        await swup.hooks.trigger("content:replace", visit);

        expect(document.querySelector('[data-stalux-shell-slot="toc"]')?.innerHTML).toBe(
            '<a href="#new">new</a>',
        );
    });

    it("lands a link navigation at the top before the swap is announced", async () => {
        const scrollTo = vi.fn();
        Object.defineProperty(window, "scrollY", { value: 640, configurable: true });
        window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
        const { swup } = await setup();
        const announced: number[] = [];
        const listener = () => announced.push(scrollTo.mock.calls.length);
        document.addEventListener("astro:after-swap", listener);
        const visit = createVisit("/posts/new");
        swup.visit = visit;
        await swup.hooks.trigger("content:replace", visit);

        expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
        expect(announced).toEqual([1]);
        document.removeEventListener("astro:after-swap", listener);
        Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    });

    it("keeps the document route in sync with the visit", async () => {
        const { swup } = await setup();
        const visit = createVisit("/posts/new");
        visit.to.route = "article";
        swup.visit = visit;
        await swup.hooks.trigger("content:replace", visit);

        expect(document.documentElement.dataset.staluxRoute).toBe("article");
        expect(document.querySelector("#swup-main")?.getAttribute("data-stalux-route")).toBe(
            "article",
        );
    });

    it("drops the oldest cached documents instead of growing the cache", async () => {
        const pages = Array.from({ length: 40 }, (_, index) => `/posts/${index}`);
        const { swup } = await setup(pages);
        await swup.hooks.trigger("cache:set", swup.visit);

        expect(swup.cache.size).toBe(32);
        expect([...swup.cache.all.keys()]).toEqual(pages.slice(8));
    });

    it("dispatches the first page-load for the initial document", async () => {
        const loads = vi.fn();
        document.addEventListener("astro:page-load", loads);
        await setup();
        await Promise.resolve();
        expect(loads).toHaveBeenCalledTimes(1);
        document.removeEventListener("astro:page-load", loads);
    });

    it("takes the current route from the document, not the empty first visit", async () => {
        window.history.pushState({}, "", "/posts/hello");
        await setup();
        expect(document.documentElement.dataset.staluxRoute).toBe("article");
        window.history.pushState({}, "", "/");
    });

    it("installs on the first hook event when the instance arrives later", async () => {
        vi.resetModules();
        const guards = await import("../src/scripts/route-guards");
        // The init script is injected by another integration and may be
        // evaluated after this module; nothing may be lost in that case.
        guards.installRouteGuards();
        const swup = createSwup();
        (window as unknown as { swup?: FakeSwup }).swup = swup;
        expect(swup.hooks.names()).not.toContain("visit:transition");

        document.dispatchEvent(new Event("swup:any"));
        expect(swup.hooks.names()).toContain("visit:transition");
        expect(swup.hooks.names()).toContain("cache:set");
    });
});
