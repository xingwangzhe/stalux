import { expect, it } from "vitest";
import { reconstructMarkdown } from "../src/utils/post-markdown";
import { isSocialImageUrl } from "../src/utils/social-image";

it("preserves explicit sharing images in Markdown exports", () => {
    expect(
        reconstructMarkdown({
            title: "中文标题与 Astro",
            desc: "摘要",
            date: "2026-10-24 23:55:00",
            abbrlink: "test",
            "og:image": "/social.png",
        }),
    ).toContain("og:image: /social.png");
});

it("allows only HTTP(S) URLs and root-relative paths for sharing images", () => {
    for (const value of [
        "javascript:alert(1)",
        "data:image/png;base64,x",
        "relative.png",
        "https://x.test/a.png title",
        "",
    ]) {
        expect(isSocialImageUrl(value)).toBe(false);
    }
    for (const value of ["/social.png", "https://cdn.test/a.png", "//cdn.test/a.png"]) {
        expect(isSocialImageUrl(value)).toBe(true);
    }
});
