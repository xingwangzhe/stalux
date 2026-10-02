import { readFileSync } from "node:fs";
import { createGenerator } from "unocss";
import { describe, expect, it } from "vitest";
import { featureStateClasses, styleFeatures } from "../src/styles/features.ts";
import { selectorRules } from "../src/styles/rule-utils.ts";
import { componentShortcuts, shortcutGroups } from "../src/styles/shortcuts.ts";
import config from "../uno.config.ts";

describe("precompiled feature styles", () => {
    it("keeps public entry paths forwarding to compiled CSS", () => {
        for (const [entry, suffix] of Object.entries({
            theme: "",
            article: "-article",
            archives: "-archives",
            categories: "-categories",
            links: "-links",
            tags: "-tags",
            words: "-words",
            prose: "-prose",
        })) {
            expect(
                readFileSync(new URL(`../src/styles/${entry}.css`, import.meta.url), "utf8"),
            ).toContain(`@import "./generated${suffix}.css"`);
        }
    });

    it("does not introduce line height with semantic font sizes", async () => {
        const uno = await createGenerator(config);
        const { css } = await uno.generate(
            "text-stalux-subtitle text-stalux-base text-stalux-small text-stalux-smaller text-stalux-tiny",
            { preflights: false },
        );
        expect(css).toContain("font-size:");
        expect(css).not.toContain("line-height:");
    });

    it("owns every component shortcut in exactly one known feature", () => {
        expect(Object.keys(shortcutGroups).sort()).toEqual(Object.keys(componentShortcuts).sort());
        for (const owner of Object.values(shortcutGroups))
            expect(owner in styleFeatures).toBe(true);
    });

    it("keeps narrower responsive rules after their broader overrides", async () => {
        const uno = await createGenerator(config);
        const { css } = await uno.generate(featureStateClasses("common").join(" "), {
            preflights: false,
        });
        expect(css.indexOf("@media (max-width: 900px)")).toBeLessThan(
            css.indexOf("@media (max-width: 600px)"),
        );
        expect(css).toContain('.stalux-nav-list[data-state="open"]');
        expect(css).toContain("font-size:0.9em");
        expect(css).not.toContain(".stalux-post-layout");
    });

    it("preserves article states without importing other feature selectors", async () => {
        const uno = await createGenerator(config);
        const { css } = await uno.generate(featureStateClasses("article").join(" "), {
            preflights: false,
        });
        expect(css).toContain(".stalux-toc-item.stalux-toc-active");
        expect(css).toContain("@media print");
        expect(css).not.toContain(".stalux-cloud-canvas");
    });

    it("fails compilation when a selector uses an unknown utility", async () => {
        const uno = await createGenerator({
            ...config,
            rules: selectorRules("invalid", [[".invalid", "stalux-missing-utility", {}]]),
        });
        await expect(uno.generate("stalux-style-invalid-0", { preflights: false })).rejects.toThrow(
            "Unknown selector utility",
        );
    });
});
