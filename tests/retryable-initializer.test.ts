import { describe, expect, it, vi } from "vitest";

import { createRetryableInitializer } from "../src/scripts/retryable-initializer";

describe("retryable lazy initializer", () => {
    it("deduplicates concurrent initialization", async () => {
        const initialize = vi.fn(async () => undefined);
        const ensureInitialized = createRetryableInitializer(initialize);

        const first = ensureInitialized();
        const second = ensureInitialized();

        expect(second).toBe(first);
        await first;
        expect(initialize).toHaveBeenCalledTimes(1);
    });

    it("allows the current page to retry after initialization fails", async () => {
        const initialize = vi
            .fn<() => Promise<void>>()
            .mockRejectedValueOnce(new Error("chunk failed"))
            .mockResolvedValueOnce(undefined);
        const ensureInitialized = createRetryableInitializer(initialize);

        await expect(ensureInitialized()).rejects.toThrow("chunk failed");
        await expect(ensureInitialized()).resolves.toBeUndefined();
        expect(initialize).toHaveBeenCalledTimes(2);
    });
});
