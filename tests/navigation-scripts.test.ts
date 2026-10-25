import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class Script extends EventTarget {
    values = new Map<string, string>();
    textContent = "";
    async = true;
    noModule = false;
    isConnected = false;
    ownerDocument?: object;
    parentElement = { tagName: "BODY" };
    remove = vi.fn();
    replaceWith = vi.fn();
    constructor(attributes: Record<string, string> = {}, content = "") {
        super();
        this.values = new Map(Object.entries(attributes));
        this.textContent = content;
    }
    get attributes() {
        return [...this.values].map(([name, value]) => ({ name, value }));
    }
    getAttribute(name: string) {
        return this.values.get(name) ?? null;
    }
    setAttribute(name: string, value: string) {
        this.values.set(name, value);
    }
    hasAttribute(name: string) {
        return this.values.has(name);
    }
    get src() {
        return this.getAttribute("src") ?? "";
    }
    set src(value: string) {
        this.setAttribute("src", value);
    }
    get type() {
        return this.getAttribute("type") ?? "";
    }
    set type(value: string) {
        this.setAttribute("type", value);
    }
    get nonce() {
        return this.getAttribute("nonce") ?? "";
    }
    set nonce(value: string) {
        this.setAttribute("nonce", value);
    }
}

let prepare: typeof import("../src/scripts/navigation-scripts").prepareNavigationScripts;
let current: Script[];
let inserted: Script[];
let document: {
    baseURI: string;
    head: { append: (script: Script) => void };
    body: { append: (script: Script) => void };
    querySelectorAll: () => Script[];
    createElement: () => Script;
};
const nextPage = (scripts: Script[]) =>
    ({
        baseURI: "https://example.com/posts/a/",
        querySelectorAll: () => scripts,
    }) as unknown as Document;
const settle = async () => {
    for (let tick = 0; tick < 8; tick++) await Promise.resolve();
};

beforeEach(async () => {
    vi.resetModules();
    current = [];
    inserted = [];
    const append = (script: Script) => inserted.push(script);
    document = {
        baseURI: "https://example.com/",
        head: { append },
        body: { append },
        querySelectorAll: () => current,
        createElement: () => new Script(),
    };
    vi.stubGlobal("document", document);
    ({ prepareNavigationScripts: prepare } = await import("../src/scripts/navigation-scripts"));
});
afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe("incoming navigation scripts", () => {
    it("waits for newly discovered modules before later inline scripts and lifecycle dispatch", async () => {
        const execute = prepare(
            nextPage([
                new Script({
                    type: "module",
                    src: "./feature.js",
                    integrity: "hash",
                    crossorigin: "anonymous",
                }),
                new Script({}, "window.inlineRan = true"),
            ]),
        );
        let done = false;
        const running = execute().then(() => {
            done = true;
        });
        expect(inserted).toHaveLength(1);
        expect(inserted[0]?.src).toBe("https://example.com/posts/a/feature.js");
        expect(inserted[0]?.getAttribute("integrity")).toBe("hash");
        expect(inserted[0]?.getAttribute("crossorigin")).toBe("anonymous");
        expect(inserted[0]?.async).toBe(false);
        await settle();
        expect(done).toBe(false);
        inserted[0]?.dispatchEvent(new Event("load"));
        await running;
        expect(inserted[1]?.textContent).toBe("window.inlineRan = true");
        expect(done).toBe(true);
        await execute();
        expect(inserted).toHaveLength(2);
    });

    it("deduplicates initial SDKs and in-flight absolute module sources across visits", async () => {
        current = [new Script({ src: "https://sdk.example/analytics.js" })];
        const page = nextPage([
            new Script({ src: "https://sdk.example/analytics.js" }),
            new Script({ type: "module", src: "/feature.js" }),
        ]);
        const first = prepare(page)();
        const second = prepare(page)();
        await settle();
        expect(inserted).toHaveLength(1);
        inserted[0]?.dispatchEvent(new Event("load"));
        await Promise.all([first, second]);
        await prepare(page)();
        expect(inserted).toHaveLength(1);
    });

    it("keeps ordinary inline scripts once per session while rerun scripts execute per visit", async () => {
        current = [new Script({}, "window.initial = true")];
        const page = nextPage([
            new Script({}, "window.initial = true"),
            new Script({}, "window.once = true"),
            new Script({ "data-astro-rerun": "" }, "window.visits++"),
        ]);
        await prepare(page)();
        await prepare(page)();
        expect(inserted.map((script) => script.textContent)).toEqual([
            "window.once = true",
            "window.visits++",
            "window.visits++",
        ]);
    });

    it("skips JSON, import maps, inert scripts, ignored scripts and nomodule fallbacks", async () => {
        await prepare(
            nextPage([
                new Script({ type: "application/ld+json" }, "{}"),
                new Script({ type: "application/json" }, "{}"),
                new Script({ type: "importmap" }, "{}"),
                new Script({ type: "text/plain" }, "example()"),
                new Script({ "data-swup-ignore-script": "", src: "/ignore.js" }),
                new Script({ nomodule: "", src: "/legacy.js" }),
            ]),
        )();
        expect(inserted).toHaveLength(0);
    });

    it("captures head scripts before replacement and replaces retained inert nodes", async () => {
        const original = new Script({}, "window.headConfig = true");
        original.parentElement = { tagName: "HEAD" };
        const append = vi.spyOn(document.head, "append");
        const execute = prepare(nextPage([original]));
        original.textContent = "changed after capture";
        await execute();
        expect(append).toHaveBeenCalledOnce();
        expect(inserted[0]?.textContent).toBe("window.headConfig = true");
        const retained = new Script({}, "window.retained = true");
        const retainedExecute = prepare(nextPage([retained]));
        retained.isConnected = true;
        retained.ownerDocument = document;
        await retainedExecute();
        expect(retained.replaceWith).toHaveBeenCalledOnce();
    });

    it("replaces HeadPlugin's inert clones and removes cached duplicates without touching the live SDK", async () => {
        const sdk = new Script({ src: "/sdk.js" });
        current = [sdk];
        const execute = prepare(
            nextPage([
                new Script({ src: "/sdk.js" }),
                new Script({ type: "module", src: "/new-page.js" }),
            ]),
        );
        const sdkClone = new Script({ src: "/sdk.js" });
        const moduleClone = new Script({ type: "module", src: "/new-page.js" });
        current = [sdk, sdkClone, moduleClone];
        const running = execute();
        await settle();
        expect(sdk.remove).not.toHaveBeenCalled();
        expect(sdkClone.remove).toHaveBeenCalledOnce();
        expect(moduleClone.replaceWith).toHaveBeenCalledOnce();
        expect(inserted).toHaveLength(0);
        const replacement = moduleClone.replaceWith.mock.calls[0]?.[0] as Script | undefined;
        replacement?.dispatchEvent(new Event("load"));
        await running;
    });

    it("waits for an ordered barrier after inline module evaluation and preserves CSP nonce", async () => {
        const running = prepare(
            nextPage([
                new Script({ type: "module", nonce: "nonce-value" }, "window.moduleReady = true"),
            ]),
        )();
        expect(inserted).toHaveLength(2);
        expect(inserted[0]?.type).toBe("module");
        expect(inserted[1]?.src).toBe("data:application/javascript,");
        expect(inserted[1]?.nonce).toBe("nonce-value");
        let done = false;
        void running.then(() => {
            done = true;
        });
        await settle();
        expect(done).toBe(false);
        inserted[1]?.dispatchEvent(new Event("load"));
        await running;
        expect(inserted[1]?.remove).toHaveBeenCalledOnce();
    });

    it("retries failed and timed-out scripts on the next visit", async () => {
        vi.useFakeTimers();
        const page = nextPage([new Script({ type: "module", src: "/retry.js" })]);
        const first = prepare(page)();
        inserted[0]?.dispatchEvent(new Event("error"));
        await first;
        const second = prepare(page, { timeoutMs: 50 })();
        expect(inserted).toHaveLength(2);
        await vi.advanceTimersByTimeAsync(50);
        await second;
        expect(inserted[1]?.remove).toHaveBeenCalledOnce();
        const third = prepare(page)();
        expect(inserted).toHaveLength(3);
        inserted[2]?.dispatchEvent(new Event("load"));
        await third;
        expect(vi.getTimerCount()).toBe(0);
    });

    it("cancels a superseded execution without starting later scripts or duplicating its pending module", async () => {
        const controller = new AbortController();
        const page = nextPage([
            new Script({ type: "module", src: "/shared.js" }),
            new Script({}, "window.obsolete = true"),
        ]);
        const first = prepare(page)(controller.signal);
        controller.abort();
        await first;
        expect(inserted).toHaveLength(1);
        const next = prepare(nextPage([new Script({ type: "module", src: "/shared.js" })]))();
        expect(inserted).toHaveLength(1);
        inserted[0]?.dispatchEvent(new Event("load"));
        await next;
        await prepare(page)(controller.signal);
        expect(inserted).toHaveLength(1);
    });
});
