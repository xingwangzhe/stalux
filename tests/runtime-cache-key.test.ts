import { describe, expect, it } from "vitest";

import { hashRuntimeSources } from "../src/internal/runtime-cache-key";

describe("runtime cache key", () => {
    it("is independent of filesystem traversal order", () => {
        const sources = [
            ["navigation.ts", "navigation"] as const,
            ["page-runtime.ts", "runtime"] as const,
        ];
        expect(hashRuntimeSources(sources)).toBe(hashRuntimeSources([...sources].reverse()));
    });

    it("changes when a shared lifecycle source changes", () => {
        const previous = hashRuntimeSources([["navigation.ts", "before"]]);
        const current = hashRuntimeSources([["navigation.ts", "after"]]);
        expect(current).not.toBe(previous);
    });
});
