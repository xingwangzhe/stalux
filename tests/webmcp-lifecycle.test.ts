import { afterEach, describe, expect, it, vi } from "vitest";

const polyfill = vi.hoisted(() => ({ initialize: vi.fn() }));
vi.mock("@mcp-b/webmcp-polyfill", () => ({ initializeWebMCPPolyfill: polyfill.initialize }));

type Register = (tool: { name: string }, options: { signal: AbortSignal }) => Promise<void>;

async function setup(registerTool?: Register) {
    const document = Object.assign(new EventTarget(), {
        readyState: "loading",
        body: { dataset: { staluxSiteLang: "zh-CN" } },
        modelContext: registerTool ? { registerTool } : undefined,
    });
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {});
    await import("../src/scripts/webmcp");
    return document;
}

async function flushRegistration() {
    for (let i = 0; i < 20; i++) await Promise.resolve();
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
});

describe("WebMCP page lifecycle", () => {
    it("unregisters all tools before swap and keeps exactly seven across 50 page mounts", async () => {
        const tools = new Set<string>();
        const signals: AbortSignal[] = [];
        const register = vi.fn<Register>(async (tool, { signal }) => {
            expect(tools.has(tool.name)).toBe(false);
            tools.add(tool.name);
            signals.push(signal);
            signal.addEventListener("abort", () => tools.delete(tool.name), { once: true });
        });
        const document = await setup(register);
        for (let page = 0; page < 50; page++) {
            document.dispatchEvent(new Event("astro:page-load"));
            await flushRegistration();
            expect(tools.size).toBe(7);
            document.dispatchEvent(new Event("astro:before-swap"));
            expect(tools.size).toBe(0);
        }
        expect(register).toHaveBeenCalledTimes(350);
        expect(signals.every((signal) => signal.aborted)).toBe(true);
    });

    it("does not register tools on a disabled page even when Astro hoists its script", async () => {
        const register = vi.fn<Register>().mockResolvedValue(undefined);
        const document = await setup(register);
        Object.assign(document.body.dataset, { staluxWebmcpEnabled: "false" });
        document.dispatchEvent(new Event("astro:page-load"));
        await flushRegistration();
        expect(register).not.toHaveBeenCalled();
    });

    it.each([false, true])(
        "stops a disposed async batch even if its pending registration rejects=%s",
        async (reject) => {
            let finish = () => {};
            const blocked = new Promise<void>((resolve, fail) => {
                finish = () => (reject ? fail(new Error("registration aborted")) : resolve());
            });
            const register = vi
                .fn<Register>()
                .mockImplementationOnce(() => blocked)
                .mockResolvedValue(undefined);
            const output = vi.spyOn(console, "error").mockImplementation(() => undefined);
            const document = await setup(register);
            document.dispatchEvent(new Event("astro:page-load"));
            expect(register).toHaveBeenCalledOnce();
            const signal = register.mock.calls[0]?.[1].signal;
            document.dispatchEvent(new Event("astro:before-swap"));
            expect(signal?.aborted).toBe(true);
            document.dispatchEvent(new Event("astro:page-load"));
            await flushRegistration();
            expect(register).toHaveBeenCalledTimes(8);
            finish();
            await flushRegistration();
            expect(register).toHaveBeenCalledTimes(8);
            expect(output).not.toHaveBeenCalled();
            document.dispatchEvent(new Event("astro:before-swap"));
        },
    );

    it("continues after a real individual tool failure and skips unsupported documents", async () => {
        const output = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const register = vi
            .fn<Register>()
            .mockRejectedValueOnce(new Error("tool failed"))
            .mockResolvedValue(undefined);
        const document = await setup(register);
        document.dispatchEvent(new Event("astro:page-load"));
        await flushRegistration();
        expect(register).toHaveBeenCalledTimes(7);
        expect(output).toHaveBeenCalledOnce();
        document.dispatchEvent(new Event("astro:before-swap"));
        document.modelContext = undefined;
        document.dispatchEvent(new Event("astro:page-load"));
        await flushRegistration();
        expect(register).toHaveBeenCalledTimes(7);
        expect(output).toHaveBeenCalledOnce();
    });
});
