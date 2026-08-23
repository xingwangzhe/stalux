import { describe, expect, it } from "vitest";
import { authorSchema, commentSchema, siteSchema } from "../src/schemas/config";
import { buildCCLink, buildCCName } from "../src/utils/cc";

describe("configuration schemas", () => {
    it("applies safe site defaults", () => {
        const parsed = siteSchema.parse({
            id: "site",
            title: "Site",
            url: "https://example.com",
            description: "Description",
        });
        expect(parsed).toMatchObject({
            lang: "zh-CN",
            timezone: "Asia/Shanghai",
            noindex: false,
            nofollow: false,
            favicon: "/favicon.ico",
        });
    });

    it("rejects malformed URLs and missing author fields", () => {
        expect(() =>
            siteSchema.parse({
                id: "site",
                title: "Site",
                url: "not-a-url",
                description: "Description",
            }),
        ).toThrow();
        expect(() => authorSchema.parse({ id: "author", name: "Only a name" })).toThrow();
    });

    it("applies Waline defaults without enabling comments", () => {
        const parsed = commentSchema.parse({ id: "comment", waline: {} });
        expect(parsed.enabled).toBe(false);
        expect(parsed.waline).toMatchObject({
            lang: "zh-CN",
            reaction: false,
            wordLimit: 200,
            pageSize: 10,
        });
    });
});

describe("Creative Commons helpers", () => {
    const translate = (key: string, values?: Record<string, string | number>) =>
        key === "cc.format" ? `${values?.elements} ${values?.version}` : key.replace("cc.", "");

    it("builds standard and CC0 links", () => {
        expect(buildCCLink("CC-BY-NC-SA-4.0")).toBe(
            "https://creativecommons.org/licenses/by-nc-sa/4.0/",
        );
        expect(buildCCLink("CC0-1.0")).toBe("https://creativecommons.org/publicdomain/zero/1.0/");
        expect(buildCCLink("invalid")).toContain("by-nc-sa/4.0");
    });

    it("formats parsed and fallback license names", () => {
        expect(buildCCName("CC-BY-NC-SA-4.0", translate)).toBe("BY-NC-SA 4.0");
        expect(buildCCName("CC0-1.0", translate)).toBe("zero");
        expect(buildCCName("invalid", translate)).toBe("BY-NC-SA 4.0");
    });
});
