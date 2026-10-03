import { afterEach, describe, expect, it, vi } from "vitest";
import {
    getArchiveDescriptionPosition,
    mountArchiveDescriptions,
} from "../src/scripts/archive-descriptions";
import { registerPageLifecycle } from "../src/scripts/page-runtime";

function setup() {
    class FakeElement extends EventTarget {
        dataset: Record<string, string> = {};
        attributes = new Map<string, string>();
        hidden = true;
        textContent = "";
        id = "archive-tooltip";
        style = { left: "", top: "" };
        offsetWidth = 320;
        offsetHeight = 100;
        parent?: FakeElement;
        isLink = false;
        contains(node: FakeElement): boolean {
            return node === this || (node.parent ? this.contains(node.parent) : false);
        }
        closest() {
            return this.isLink ? this : null;
        }
        getAttribute(name: string) {
            return this.attributes.get(name) ?? null;
        }
        setAttribute(name: string, value: string) {
            this.attributes.set(name, value);
        }
        removeAttribute(name: string) {
            this.attributes.delete(name);
        }
        getBoundingClientRect() {
            return { left: 100, right: 200, top: 100, bottom: 130 };
        }
    }
    const root = new FakeElement();
    const tooltip = new FakeElement();
    const link = new FakeElement();
    link.parent = root;
    link.isLink = true;
    link.dataset.archiveDescription = " A <b>plain text</b> description ";
    const other = new FakeElement();
    other.isLink = true;
    other.parent = root;
    other.dataset.archiveDescription = "Another description";
    const hover = Object.assign(new EventTarget(), { matches: true });
    const win = Object.assign(new EventTarget(), { matchMedia: () => hover });
    const doc = Object.assign(new EventTarget(), {
        hidden: false,
        documentElement: { clientWidth: 1000, clientHeight: 800 },
        querySelector: vi.fn((selector: string) => (selector.includes("tooltip") ? tooltip : root)),
    });
    vi.stubGlobal("Element", FakeElement);
    vi.stubGlobal("Node", FakeElement);
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", doc);
    const emit = (type: string, target: unknown = link, relatedTarget: unknown = null) => {
        const event = new Event(type);
        Object.defineProperties(event, {
            target: { value: target },
            relatedTarget: { value: relatedTarget },
        });
        root.dispatchEvent(event);
    };
    return { root, tooltip, link, other, doc, win, hover, emit };
}

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("archive description preview", () => {
    it("positions to the right, falls below and clamps to viewport edges", () => {
        const rect = { left: 100, right: 200, top: 100, bottom: 130 };
        expect(getArchiveDescriptionPosition(rect, 320, 100, 1000, 800)).toEqual({
            left: 212,
            top: 100,
        });
        expect(
            getArchiveDescriptionPosition({ ...rect, left: 700, right: 950 }, 320, 100, 1000, 800),
        ).toEqual({ left: 664, top: 138 });
        expect(
            getArchiveDescriptionPosition(
                { left: -20, right: 350, top: 780, bottom: 800 },
                320,
                100,
                390,
                844,
            ),
        ).toEqual({ left: 16, top: 728 });
    });

    it("shows pure text for hover and focus, restoring previous accessibility descriptions", () => {
        const { tooltip, link, other, emit } = setup();
        link.setAttribute("aria-describedby", "existing");
        const dispose = mountArchiveDescriptions();
        emit("pointerover");
        expect(tooltip.hidden).toBe(false);
        expect(tooltip.textContent).toBe("A <b>plain text</b> description");
        expect(tooltip.style).toEqual({ left: "212px", top: "100px" });
        expect(link.getAttribute("aria-describedby")).toBe("existing archive-tooltip");
        emit("pointerover");
        expect(link.getAttribute("aria-describedby")).toBe("existing archive-tooltip");
        emit("focusin", other);
        expect(link.getAttribute("aria-describedby")).toBe("existing");
        expect(tooltip.textContent).toBe("Another description");
        dispose?.();
        expect(other.getAttribute("aria-describedby")).toBeNull();
        expect(tooltip.hidden).toBe(true);
    });

    it("lets the pointer cross into the tooltip and closes after leaving", () => {
        vi.useFakeTimers();
        const { root, tooltip, link, emit } = setup();
        const dispose = mountArchiveDescriptions();
        emit("pointerover");
        emit("pointerout", link, link);
        expect(vi.getTimerCount()).toBe(0);
        emit("pointerout", link, tooltip);
        expect(vi.getTimerCount()).toBe(0);
        emit("pointerout", root);
        expect(vi.getTimerCount()).toBe(0);
        emit("pointerout");
        expect(vi.getTimerCount()).toBe(1);
        tooltip.dispatchEvent(new Event("pointerenter"));
        vi.advanceTimersByTime(120);
        expect(tooltip.hidden).toBe(false);
        emit("pointerout");
        vi.advanceTimersByTime(120);
        expect(tooltip.hidden).toBe(true);
        emit("focusin");
        tooltip.dispatchEvent(new Event("pointerleave"));
        expect(tooltip.hidden).toBe(true);
        dispose?.();
    });

    it("skips empty descriptions and touch hover while retaining keyboard focus", () => {
        const { tooltip, link, hover, emit } = setup();
        const dispose = mountArchiveDescriptions();
        link.dataset.archiveDescription = " ";
        emit("pointerover");
        expect(tooltip.hidden).toBe(true);
        delete link.dataset.archiveDescription;
        emit("pointerover");
        expect(tooltip.hidden).toBe(true);
        link.dataset.archiveDescription = "A description";
        hover.matches = false;
        emit("pointerover");
        expect(tooltip.hidden).toBe(true);
        emit("focusin");
        expect(tooltip.hidden).toBe(false);
        dispose?.();
    });

    it("ignores unrelated targets and hides on escapeEvent, scroll, resize, print and background", () => {
        const { tooltip, doc, win, hover, emit } = setup();
        const dispose = mountArchiveDescriptions();
        emit("pointerover", {});
        expect(tooltip.hidden).toBe(true);
        emit("pointerover", { closest: () => null });
        expect(tooltip.hidden).toBe(true);
        emit("focusin");
        const key = new Event("keydown");
        Object.defineProperty(key, "key", { value: "Enter" });
        doc.dispatchEvent(key);
        expect(tooltip.hidden).toBe(false);
        const escapeEvent = new Event("keydown");
        Object.defineProperty(escapeEvent, "key", { value: "Escape" });
        doc.dispatchEvent(escapeEvent);
        expect(tooltip.hidden).toBe(true);
        for (const [target, type] of [
            [doc, "scroll"],
            [win, "resize"],
            [win, "beforeprint"],
            [hover, "change"],
        ] as const) {
            emit("focusin");
            target.dispatchEvent(new Event(type));
            expect(tooltip.hidden).toBe(true);
        }
        emit("focusin");
        doc.dispatchEvent(new Event("visibilitychange"));
        expect(tooltip.hidden).toBe(false);
        doc.hidden = true;
        doc.dispatchEvent(new Event("visibilitychange"));
        expect(tooltip.hidden).toBe(true);
        dispose?.();
    });

    it("cleans listeners and pending timers across repeated loads and soft navigation", () => {
        vi.useFakeTimers();
        const { doc, tooltip, emit, root } = setup();
        const remove = vi.spyOn(root, "removeEventListener");
        const unregister = registerPageLifecycle("archive-descriptions", mountArchiveDescriptions, {
            host: {},
            target: doc,
            queueTask: (fn) => fn(),
        });
        doc.dispatchEvent(new Event("astro:page-load"));
        doc.dispatchEvent(new Event("astro:page-load"));
        expect(remove).toHaveBeenCalledTimes(4);
        emit("focusin");
        emit("focusout");
        expect(vi.getTimerCount()).toBe(1);
        doc.dispatchEvent(new Event("astro:before-swap"));
        expect(vi.getTimerCount()).toBe(0);
        emit("focusin");
        expect(tooltip.hidden).toBe(true);
        doc.dispatchEvent(new Event("astro:page-load"));
        emit("focusin");
        expect(tooltip.hidden).toBe(false);
        unregister();
        expect(tooltip.hidden).toBe(true);
    });

    it("uses the browser top layer and closes it before navigation", () => {
        const { tooltip, emit, doc } = setup();
        const popup = Object.assign(tooltip, { showPopover: vi.fn(), hidePopover: vi.fn() });
        const dispose = mountArchiveDescriptions();
        expect(popup.getAttribute("popover")).toBe("manual");
        emit("pointerover");
        emit("pointerover");
        expect(popup.showPopover).toHaveBeenCalledOnce();
        const scroll = new Event("scroll");
        Object.defineProperty(scroll, "target", { value: tooltip });
        doc.dispatchEvent(scroll);
        expect(popup.hidden).toBe(false);
        doc.dispatchEvent(new Event("scroll"));
        expect(popup.hidePopover).toHaveBeenCalledOnce();
        emit("focusin");
        expect(popup.showPopover).toHaveBeenCalledTimes(2);
        dispose?.();
        expect(popup.hidePopover).toHaveBeenCalledTimes(2);
    });

    it("does nothing outside archives or without a tooltip", () => {
        const { doc } = setup();
        doc.querySelector.mockReturnValue(null as never);
        expect(mountArchiveDescriptions()).toBeUndefined();
        doc.querySelector.mockImplementation((selector) =>
            selector.includes("tooltip") ? (null as never) : ({} as never),
        );
        expect(mountArchiveDescriptions()).toBeUndefined();
    });
});
