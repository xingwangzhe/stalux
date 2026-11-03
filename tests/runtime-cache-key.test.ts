import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { createRuntimeCacheKey, hashRuntimeSources } from "../src/internal/runtime-cache-key";

describe("runtime cache key", () => {
    it("invalidates restored HTML and Markdown when theme YAML configuration changes", async () => {
        const root = mkdtempSync(path.join(tmpdir(), "stalux-config-cache-"));
        try {
            const scripts = path.join(root, "scripts");
            const config = path.join(root, "config");
            const manifest = path.join(root, "package.json");
            mkdirSync(scripts);
            mkdirSync(config);
            writeFileSync(manifest, '{"version":"1.35.13"}');
            writeFileSync(path.join(scripts, "runtime.ts"), "export {};");
            const file = path.join(config, "promote.yml");
            const key = () =>
                createRuntimeCacheKey(scripts, manifest, undefined, undefined, config);
            const empty = await key();
            writeFileSync(file, "export_md: true\n");
            const enabled = await key();
            expect(enabled).not.toBe(empty);
            writeFileSync(file, "export_md: true\n");
            expect(await key()).toBe(enabled);
            writeFileSync(path.join(config, "notes.txt"), "ignored");
            expect(await key()).toBe(enabled);
            writeFileSync(file, "export_md: false\n");
            expect(await key()).not.toBe(enabled);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
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
    it("invalidates route caches for generated CSS changes without depending on timestamps", async () => {
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
            const initial = await createRuntimeCacheKey(scripts, manifest, styles);
            expect(await createRuntimeCacheKey(scripts, manifest, styles, "map-one")).not.toBe(
                await createRuntimeCacheKey(scripts, manifest, styles, "map-two"),
            );
            writeFileSync(css, ".card{color:red}");
            expect(await createRuntimeCacheKey(scripts, manifest, styles)).toBe(initial);
            writeFileSync(css, ".card{color:blue}");
            expect(await createRuntimeCacheKey(scripts, manifest, styles)).not.toBe(initial);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});
