import { describe, expect, it } from "vitest";

import { findMissingAssetReferences } from "../scripts/verify-build-utils.mjs";

describe("generated asset references", () => {
    it("reports a generated file that references a missing Astro asset", () => {
        const missing = findMissingAssetReferences(
            new Map([
                ["index.html", '<link href="/_astro/pagefind.css">'],
                ["_astro/app.js", 'import "/_astro/chunk.js"'],
            ]),
            new Set(["/_astro/chunk.js"]),
        );

        expect(missing).toEqual(["index.html -> /_astro/pagefind.css"]);
    });

    it("deduplicates repeated missing references", () => {
        const missing = findMissingAssetReferences(
            new Map([["index.html", '"/_astro/missing.css" "/_astro/missing.css"']]),
            new Set(),
        );

        expect(missing).toEqual(["index.html -> /_astro/missing.css"]);
    });

    it("accepts an asset directory prefix when generated files exist below it", () => {
        const missing = findMissingAssetReferences(
            new Map([["index.html", 'src: url("/_astro/fonts/body.woff2")']]),
            new Set(["/_astro/fonts/body.woff2"]),
        );

        expect(missing).toEqual([]);
    });
});
