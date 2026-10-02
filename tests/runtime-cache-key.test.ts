import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { createRuntimeCacheKey, hashRuntimeSources } from "../src/internal/runtime-cache-key";

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
    it("invalidates route caches for generated CSS changes without depending on timestamps", () => {
        const root = mkdtempSync(path.join(tmpdir(), "stalux-css-cache-"));
        try {
            const scripts = path.join(root, "scripts");
            const styles = path.join(root, "styles");
            const manifest = path.join(root, "package.json");
            mkdirSync(scripts);
            mkdirSync(styles);
            writeFileSync(manifest, '{"version":"1.30.0"}');
            writeFileSync(path.join(scripts, "runtime.ts"), "export {};");
            const css = path.join(styles, "generated.css");
            writeFileSync(css, ".card{color:red}");
            const initial = createRuntimeCacheKey(scripts, manifest, styles);
            writeFileSync(css, ".card{color:red}");
            expect(createRuntimeCacheKey(scripts, manifest, styles)).toBe(initial);
            writeFileSync(css, ".card{color:blue}");
            expect(createRuntimeCacheKey(scripts, manifest, styles)).not.toBe(initial);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});
