import expressiveCodeBase from "astro-expressive-code";
import { describe, expect, it, vi } from "vitest";
import { expressiveCode } from "../src/expressive-code";

vi.mock("astro-expressive-code", () => ({ default: vi.fn(() => ({ name: "test-ec" })) }));

describe("Expressive Code defaults", () => {
    it("uses one dark theme without automatic or selector-based switching", () => {
        expressiveCode();
        const options = vi.mocked(expressiveCodeBase).mock.lastCall?.[0];
        expect(options).toMatchObject({
            themes: ["dark-plus"],
            useDarkModeMediaQuery: false,
            themeCssSelector: false,
        });
        expect(options?.plugins).toHaveLength(2);
    });

    it("preserves explicit consumer options and extra plugins", () => {
        const plugin = { name: "consumer-plugin" };
        expressiveCode({ themes: ["dracula"], plugins: [plugin] });
        const options = vi.mocked(expressiveCodeBase).mock.lastCall?.[0];
        expect(options?.themes).toEqual(["dracula"]);
        expect(options?.plugins).toContain(plugin);
        expect(options?.useDarkModeMediaQuery).toBe(false);
    });
});
