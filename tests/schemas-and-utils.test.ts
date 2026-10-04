import { describe, expect, it } from "vitest";
import en from "../src/i18n/en.json";
import zhCN from "../src/i18n/zh-CN.json";
import { authorSchema, commentSchema, siteSchema } from "../src/schemas/config";
import { getAccentColorStyle } from "../src/utils/accent-color";
import { buildCCLink, buildCCName } from "../src/utils/cc";
import { createTranslator } from "../src/utils/i18n";
import {
    getPostTitleTransitionName,
    getRouteAnimation,
    getSidebarAnimation,
} from "../src/utils/view-transitions";

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
            accentColor: "#EAB308",
        });
    });

    it("accepts a six-digit theme accent and rejects malformed values", () => {
        const valid = siteSchema.parse({
            id: "site",
            title: "Site",
            url: "https://example.com",
            description: "Description",
            accentColor: "#3366CC",
        });
        expect(valid.accentColor).toBe("#3366CC");
        for (const accentColor of ["3366CC", "#369", "#GG66CC", "red"]) {
            expect(() =>
                siteSchema.parse({
                    id: "site",
                    title: "Site",
                    url: "https://example.com",
                    description: "Description",
                    accentColor,
                }),
            ).toThrow();
        }
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

describe("accent color tokens", () => {
    it("derives the base color, RGB, and opacity variants", () => {
        expect(getAccentColorStyle("#3366CC")).toContain("--stalux-accent-color: #3366cc");
        expect(getAccentColorStyle("#3366CC")).toContain("--stalux-accent-rgb: 51 102 204");
        expect(getAccentColorStyle("#3366CC")).toContain("--accent-50p: rgb(51 102 204 / 0.5)");
        expect(getAccentColorStyle(undefined)).toContain("--stalux-accent-color: #eab308");
        expect(() => getAccentColorStyle("#369")).toThrow();
    });
});

describe("route transition mapping", () => {
    it("selects direction-aware page animations and stable post identity", () => {
        const kinds = [
            "home",
            "archive",
            "links",
            "words",
            "about",
            "tags-index",
            "tags-detail",
            "categories-index",
            "categories-detail",
            "article",
            "not-found",
            "other",
        ] as const;
        for (const kind of kinds) {
            const animation = getRouteAnimation(kind);
            expect(animation.forwards.new).toHaveProperty("name");
            expect(animation.backwards.new).toHaveProperty("name");
            expect(animation.forwards.new).not.toEqual(animation.backwards.new);
        }
        expect(getRouteAnimation("article").backwards.new).toMatchObject({
            name: "stalux-article-enter-back",
        });
        expect(getRouteAnimation("tags-detail").forwards.new).toMatchObject({
            name: "stalux-taxonomy-enter",
        });
        expect(getSidebarAnimation("left").forwards.new).toMatchObject({
            name: "stalux-sidebar-left-in",
        });
        expect(getSidebarAnimation("right").backwards.new).toMatchObject({
            name: "stalux-sidebar-right-back-in",
        });
        expect(getPostTitleTransitionName("post-1")).toBe(getPostTitleTransitionName("post-1"));
        expect(getPostTitleTransitionName("post-1")).not.toBe(getPostTitleTransitionName("post-2"));
        expect(getPostTitleTransitionName("post-1")).toMatch(/^stalux-post-title-[a-z0-9]+$/);
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

describe("translation dictionaries", () => {
    const flatten = (value: unknown, prefix = ""): Map<string, unknown> => {
        const entries = new Map<string, unknown>();
        if (value && typeof value === "object" && !Array.isArray(value)) {
            for (const [key, child] of Object.entries(value)) {
                for (const [path, leaf] of flatten(child, prefix ? `${prefix}.${key}` : key)) {
                    entries.set(path, leaf);
                }
            }
        } else {
            entries.set(prefix, value);
        }
        return entries;
    };

    it("has matching, non-empty keys in every supported dictionary", () => {
        const english = flatten(en);
        const chinese = flatten(zhCN);
        expect([...chinese.keys()].sort()).toEqual([...english.keys()].sort());
        for (const [language, entries] of Object.entries({ en: english, "zh-CN": chinese })) {
            for (const [key, value] of entries) {
                expect(value, `${language}.${key}`).toEqual(expect.any(String));
                expect(String(value).trim(), `${language}.${key}`).not.toBe("");
            }
        }
    });

    it("uses English for English regional locales and falls back to English for missing keys", () => {
        const { t, lang } = createTranslator("en-GB");
        expect(lang).toBe("en");
        expect(t("post.navigation")).toBe("Post navigation");
        expect(t("missing.key")).toBe("missing.key");
    });
});
