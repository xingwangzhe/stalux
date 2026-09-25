import { describe, expect, it } from "vitest";

import {
    appendUniquePlugin,
    collectPluginNames,
    prepareSatteriProcessor,
} from "../src/internal/satteri-config";
import { applyHtmlImageLoadingPolicy, applyImageLoadingPolicy } from "../src/plugins/feature-flags";

describe("Satteri integration configuration", () => {
    it("rejects missing and non-Satteri processors", () => {
        expect(prepareSatteriProcessor(undefined)).toBeUndefined();
        expect(prepareSatteriProcessor("satteri")).toBeUndefined();
        expect(prepareSatteriProcessor({ name: "remark" })).toBeUndefined();
    });

    it("applies defaults while preserving explicit feature opt-outs", () => {
        const processor = {
            name: "satteri",
            options: {
                mdastPlugins: [{ name: "existing-mdast" }],
                features: { math: false, custom: true },
            },
        };
        const options = prepareSatteriProcessor(processor);
        expect(options?.features).toEqual({
            math: false,
            custom: true,
            frontmatter: true,
            gfm: true,
            smartPunctuation: true,
        });
        expect(options?.mdastPlugins).toHaveLength(1);
        expect(options?.hastPlugins).toEqual([]);
        expect(processor.options).toBe(options);
    });

    it("deduplicates named plugins across both phases", () => {
        const options = prepareSatteriProcessor({
            name: "satteri",
            options: {
                mdastPlugins: [{ name: "shared" }],
                hastPlugins: [{ name: "hast" }],
            },
        });
        expect(options).toBeDefined();
        if (!options) return;

        const seen = collectPluginNames(options);
        appendUniquePlugin(options.mdastPlugins, { name: "shared" }, seen);
        appendUniquePlugin(options.mdastPlugins, { name: "new" }, seen);
        appendUniquePlugin(options.hastPlugins, { name: "new" }, seen);

        expect(options.mdastPlugins).toEqual([{ name: "shared" }, { name: "new" }]);
        expect(options.hastPlugins).toHaveLength(1);
    });

    it("keeps anonymous plugin entries because they cannot be safely deduplicated", () => {
        const list = [false];
        const seen = new Set<string>();
        appendUniquePlugin(list, false, seen);
        expect(list).toEqual([false, false]);
        expect(seen.size).toBe(0);
    });
});

describe("Markdown image loading policy", () => {
    it("prioritizes the first image as a potential LCP candidate", () => {
        const properties: Record<string, unknown> = {};
        applyImageLoadingPolicy(properties, true);
        expect(properties).toEqual({
            loading: "eager",
            decoding: "async",
            fetchpriority: "high",
        });
    });

    it("lazy-loads subsequent images even when an upstream plugin marked them eager", () => {
        const properties: Record<string, unknown> = {
            loading: "eager",
            decoding: "sync",
            fetchpriority: "high",
        };
        applyImageLoadingPolicy(properties, false);
        expect(properties).toEqual({
            loading: "lazy",
            decoding: "sync",
            fetchpriority: "auto",
        });
    });

    it("preserves non-high explicit priority on later images", () => {
        const properties: Record<string, unknown> = { fetchpriority: "low" };
        applyImageLoadingPolicy(properties, false);
        expect(properties).toEqual({
            loading: "lazy",
            decoding: "async",
            fetchpriority: "low",
        });
    });

    it("sets emitted HTML image hints without changing sources or wrappers", () => {
        const input =
            '<img src="avatar.jpg"><section data-pagefind-body><p><a href="large.jpg"><img src="small.jpg" alt="one"></a></p><img src="two.jpg" loading="eager"></section>';
        expect(applyHtmlImageLoadingPolicy(input)).toBe(
            '<img src="avatar.jpg"><section data-pagefind-body><p><a href="large.jpg"><img src="small.jpg" alt="one" decoding="async" loading="eager" fetchpriority="high"></a></p><img src="two.jpg" loading="lazy" decoding="async"></section>',
        );
    });
});
