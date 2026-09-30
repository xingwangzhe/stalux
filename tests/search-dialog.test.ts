import { describe, expect, it, vi } from "vitest";

import { ensureSearchStyles, upgradeAndOpenSearchDialog } from "../src/scripts/search-dialog";

describe("Pagefind search dialog", () => {
    it("waits for a cold stylesheet before the caller can open the dialog", async () => {
        const link = Object.assign(new EventTarget(), {
            rel: "prefetch",
            media: "all",
            sheet: null,
        });
        const open = vi.fn();
        const ready = ensureSearchStyles(link as unknown as HTMLLinkElement).then(open);
        await Promise.resolve();
        expect(link.media).toBe("all");
        expect(link.rel).toBe("stylesheet");
        expect(open).not.toHaveBeenCalled();
        link.dispatchEvent(new Event("load"));
        await ready;
        expect(open).toHaveBeenCalledOnce();
    });

    it("uses an already loaded stylesheet without waiting for another load event", async () => {
        const link = Object.assign(new EventTarget(), { media: "print", sheet: {} });
        await ensureSearchStyles(link as unknown as HTMLLinkElement);
        expect(link.media).toBe("all");
    });

    it("rejects a failed stylesheet instead of opening an unstyled dialog", async () => {
        const link = Object.assign(new EventTarget(), { media: "print", sheet: null });
        const ready = ensureSearchStyles(link as unknown as HTMLLinkElement);
        const assertion = expect(ready).rejects.toThrow("Search stylesheet failed to load");
        link.dispatchEvent(new Event("error"));
        await assertion;
    });

    it("waits for the custom element, upgrades it, and then opens it", async () => {
        const events: string[] = [];
        const dialog = { open: vi.fn(() => events.push("open")) };
        const registry = {
            whenDefined: vi.fn(async () => events.push("defined")),
            upgrade: vi.fn(() => events.push("upgrade")),
        };

        await upgradeAndOpenSearchDialog(registry, dialog);

        expect(events).toEqual(["defined", "upgrade", "open"]);
        expect(registry.whenDefined).toHaveBeenCalledWith("pagefind-modal");
        expect(registry.upgrade).toHaveBeenCalledWith(dialog);
    });

    it("does not try to upgrade or open a dialog that is no longer in the page", async () => {
        const registry = {
            whenDefined: vi.fn(async () => undefined),
            upgrade: vi.fn(),
        };

        await upgradeAndOpenSearchDialog(registry, null);

        expect(registry.upgrade).not.toHaveBeenCalled();
    });
});
