import { afterEach, expect, it, vi } from "vitest";
import { mountCodeAccessibility } from "../src/scripts/code-accessibility";

afterEach(() => vi.unstubAllGlobals());
it("does not measure skipped code and restores keyboard access when it is rendered", () => {
    class ElementMock {
        isConnected = true;
        rendered = false;
        checkVisibility() {
            return this.rendered;
        }
        matches() {
            return true;
        }
        attrs = new Map<string, string>();
        hasAttribute(name: string) {
            return this.attrs.has(name);
        }
        setAttribute(name: string, value: string) {
            this.attrs.set(name, value);
        }
        tagName = "PRE";
        clientWidth = 100;
        widthReads = 0;
        get scrollWidth() {
            this.widthReads++;
            return 200;
        }
        parentElement?: ElementMock;
    }
    vi.stubGlobal("HTMLElement", ElementMock);
    const pre = new ElementMock();
    const code = new ElementMock();
    code.parentElement = pre;
    const target = Object.assign(new EventTarget(), { querySelectorAll: () => [code] });
    const dispose = mountCodeAccessibility(target as unknown as Document);
    expect(pre.widthReads).toBe(0);
    code.rendered = true;
    const reveal = () => {
        const event = Object.assign(new Event("contentvisibilityautostatechange"), {
            skipped: false,
        });
        Object.defineProperty(event, "target", { value: code });
        target.dispatchEvent(event);
    };
    reveal();
    expect(pre.attrs.get("tabindex")).toBe("0");
    expect(pre.attrs.get("role")).toBe("region");
    pre.attrs.set("tabindex", "-1");
    pre.attrs.set("role", "note");
    reveal();
    expect(pre.attrs.get("tabindex")).toBe("-1");
    expect(pre.attrs.get("role")).toBe("note");
    pre.attrs.clear();
    dispose?.();
    reveal();
    expect(pre.attrs.size).toBe(0);
});
