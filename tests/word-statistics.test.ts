import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ collection: vi.fn(), analyze: vi.fn() }));
vi.mock("astro:content", () => ({ getCollection: mocks.collection }));
vi.mock("@plugins/feature-flags", () => ({ analyzeFeatureFlags: mocks.analyze }));

describe("shared post statistics", () => {
    it("shares concurrent totals and descriptions and retains input order", async () => {
        vi.resetModules();
        mocks.collection.mockResolvedValue([
            { id: "a", body: "first", data: { abbrlink: "a", desc: "A" } },
            { id: "b", body: "second", data: { abbrlink: "b", desc: "B" } },
        ]);
        mocks.analyze.mockImplementation(async (body: string) => ({ wordCount: body.length }));
        const { getTotalWordCount, getPostDescriptions } = await import(
            "../src/utils/word-count-utils"
        );
        const [first, descriptions, second] = await Promise.all([
            getTotalWordCount(),
            getPostDescriptions(),
            getTotalWordCount(),
        ]);
        expect(first).toBe(11);
        expect(second).toBe(11);
        expect([...descriptions]).toEqual([
            ["a", { desc: "A", wordCount: 5 }],
            ["b", { desc: "B", wordCount: 6 }],
        ]);
        expect(mocks.collection).toHaveBeenCalledTimes(1);
        expect(mocks.analyze).toHaveBeenCalledTimes(2);
    });
    it("preserves total's zero fallback and retries a failed shared load", async () => {
        vi.resetModules();
        mocks.collection
            .mockReset()
            .mockRejectedValueOnce(new Error("content unavailable"))
            .mockResolvedValue([]);
        const { getTotalWordCount, getPostDescriptions } = await import(
            "../src/utils/word-count-utils"
        );
        expect(await getTotalWordCount()).toBe(0);
        expect(await getPostDescriptions()).toEqual(new Map());
        expect(mocks.collection).toHaveBeenCalledTimes(2);
    });
});
