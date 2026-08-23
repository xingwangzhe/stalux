import { describe, expect, it } from "vitest";

import {
    appendUniquePlugin,
    collectPluginNames,
    prepareSatteriProcessor,
} from "../src/internal/satteri-config";

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
