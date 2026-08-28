import { describe, expect, it, vi } from "vitest";

import { upgradeAndOpenSearchDialog } from "../src/scripts/search-dialog";

describe("Pagefind search dialog", () => {
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
