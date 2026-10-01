import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

describe("Vercount navigation", () => {
    it("loads outside Partytown and replaces its loader for the incoming page", async () => {
        const scripts: Array<Record<string, unknown>> = [];
        const doc = Object.assign(new EventTarget(), {
            body: { dataset: {} },
            head: { appendChild: (script: Record<string, unknown>) => scripts.push(script) },
            createElement: () => {
                const script: Record<string, unknown> = { dataset: {} };
                script.remove = () => scripts.splice(scripts.indexOf(script), 1);
                return script;
            },
            querySelector: () => scripts[0],
        });
        const host = new EventTarget();
        vi.stubGlobal("document", doc);
        vi.stubGlobal(
            "window",
            Object.assign(host, { location: { href: "https://example.org/" } }),
        );
        await import("../src/scripts/analytics-runtime");
        doc.dispatchEvent(new Event("astro:page-load"));
        expect(scripts).toHaveLength(1);
        expect(scripts[0]).toMatchObject({
            async: true,
            src: "https://events.vercount.one/js",
            dataset: { staluxVercount: "true" },
        });
        expect(scripts[0]?.type).toBeUndefined();
        const first = scripts[0];
        doc.dispatchEvent(new Event("astro:page-load"));
        expect(scripts).toHaveLength(1);
        expect(scripts[0]).not.toBe(first);
    });
});
