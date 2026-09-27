import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("card transparency", () => {
    it("uses 5% shared card surfaces and lighter card shadows", () => {
        const tokens = read("../src/styles/base/init.css");
        expect(tokens).toContain("--surface-glass: var(--black-05p)");
        expect(tokens).toContain("--black-05p: rgba(0, 0, 0, 0.05)");
        expect(tokens).toContain("--card-box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08)");
        expect(tokens).toContain("--card-box-shadow-hover: 0 14px 28px rgba(0, 0, 0, 0.12)");
    });

    it("keeps individual card surfaces at 5% on hover", () => {
        const files = [
            "../src/styles/components/categories/categoriesCard.module.css",
            "../src/styles/components/links/linkCard.module.css",
            "../src/styles/components/posts/postAuthor.module.css",
            "../src/styles/components/posts/waline.css",
            "../src/styles/components/tags/tagsCloud.module.css",
            "../src/styles/components/words/wordCard.module.css",
        ];
        const styles = files.map(read).join("\n");

        expect(styles).toContain("background-color: var(--white-05p)");
        expect(styles).toContain("background: var(--white-05p)");
        expect(styles).toContain("background: var(--black-05p)");
        expect(styles).toContain("background-color: rgba(17, 17, 17, 0.05) !important");
        expect(styles).not.toContain("#ffffff26");
    });
});
