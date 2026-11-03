import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";
import { optimizeWebMcpMutations } from "../src/internal/webmcp-mutations";
import { affectsDeclarativeTools } from "../src/scripts/webmcp-mutations";

afterEach(() => vi.unstubAllGlobals());

describe("declarative WebMCP mutation filtering", () => {
    it("patches the verified upstream observer only and leaves other versions intact", () => {
        const source = [
            "function installDeclarativeForms(document, context) {}",
            "const observer = new MutationObserver(sync);",
        ].join("\n");
        expect(optimizeWebMcpMutations(source, "5.1.0")).toContain("if (relevant(records)) sync()");
        expect(optimizeWebMcpMutations(source, "5.1.1")).toBeUndefined();
        expect(optimizeWebMcpMutations(source, "6.0.3")).toBeUndefined();
        expect(optimizeWebMcpMutations("changed upstream implementation", "5.1.0")).toBeUndefined();
        const installed = readFileSync(
            createRequire(import.meta.url).resolve("@mcp-b/webmcp-polyfill"),
            "utf8",
        );
        expect(optimizeWebMcpMutations(installed, "6.0.3")).toBeUndefined();
    });

    it("ignores ordinary text/styles but preserves forms, external labels and shadow hosts", () => {
        class ElementMock {
            constructor(
                public relevant = false,
                public descendants: ElementMock[] = [],
                public shadow = false,
            ) {}
            matches() {
                return this.relevant;
            }
            closest() {
                return this.relevant ? this : null;
            }
            querySelector() {
                return this.descendants.find((child) => child.relevant) ?? null;
            }
            querySelectorAll() {
                return this.descendants;
            }
            get shadowRoot() {
                return this.shadow ? {} : null;
            }
        }
        vi.stubGlobal("Element", ElementMock);
        const record = (
            target: unknown,
            addedNodes: unknown[] = [],
            removedNodes: unknown[] = [],
        ) =>
            [
                { target, type: "childList", addedNodes, removedNodes },
            ] as unknown as MutationRecord[];
        expect(affectsDeclarativeTools(record(new ElementMock(), [{ parentElement: null }]))).toBe(
            false,
        );
        expect(affectsDeclarativeTools(record({ parentElement: new ElementMock() }))).toBe(false);
        expect(affectsDeclarativeTools(record(new ElementMock(true)))).toBe(true);
        expect(
            affectsDeclarativeTools(
                record(new ElementMock(), [new ElementMock(false, [new ElementMock(true)])]),
            ),
        ).toBe(true);
        expect(
            affectsDeclarativeTools(record(new ElementMock(), [], [new ElementMock(true)])),
        ).toBe(true);
        expect(
            affectsDeclarativeTools(record(new ElementMock(), [new ElementMock(false, [], true)])),
        ).toBe(true);
    });
});
