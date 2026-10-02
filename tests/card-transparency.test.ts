import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("card transparency", () => {
    it("uses 5% shared card surfaces and lighter card shadows", () => {
        const tokens = read("../src/styles/base.css");
        expect(tokens).toContain("--surface-glass: var(--black-05p)");
        expect(tokens).toContain("--black-05p: rgba(0, 0, 0, 0.05)");
        expect(tokens).toContain("--card-box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08)");
        expect(tokens).toContain("--card-box-shadow-hover: 0 14px 28px rgba(0, 0, 0, 0.12)");
    });

    it("keeps individual card surfaces at 5% on hover", () => {
        const files = [
            "../src/styles/generated-categories.css",
            "../src/styles/generated-links.css",
            "../src/styles/generated.css",
            "../src/styles/generated-waline.css",
            "../src/styles/generated-tags.css",
            "../src/styles/generated-words.css",
        ];
        const styles = files.map(read).join("\n");

        expect(styles).toContain("background-color:var(--white-05p)");
        expect(styles).toContain("background:var(--white-05p)");
        expect(read("../src/styles/shortcuts.ts")).toContain("[background:var(--black-05p)]");
        expect(styles).toContain("#1111110d!important");
    });

    it("does not let the global transparent anchor style erase the link card surface", () => {
        const linkCard = read("../src/components/stalux/links/linkCard.astro");
        expect(linkCard).toContain('class="stalux-link-card"');
        expect(linkCard).not.toMatch(/class=\{`\$\{styles\.card\} a-none`\}/u);
    });
});
