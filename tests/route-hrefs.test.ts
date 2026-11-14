import { parse } from "parse5";
import { describe, expect, it } from "vitest";
import { normalizeRouteHref, normalizeRouteHrefs } from "../src/internal/route-hrefs";

describe("route href normalisation", () => {
    it.each([
        ["/posts/a1b2c3d4", "/posts/a1b2c3d4/"],
        ["/posts/a1b2c3d4/", "/posts/a1b2c3d4/"],
        ["/tags/Astro", "/tags/Astro/"],
        ["/tags/node.js", "/tags/node.js/"],
        ["/archives", "/archives/"],
        ["/posts/a1b2c3d4?from=list", "/posts/a1b2c3d4/?from=list"],
        ["/tags/Astro#top", "/tags/Astro/#top"],
    ])("rewrites %s to %s", (href, expected) => {
        expect(normalizeRouteHref(href)).toBe(expected);
    });

    it.each([
        "/",
        "/404",
        "/posts/a1b2c3d4.md",
        "/about.md",
        "/api/posts.json",
        "/openapi.json",
        "/rss.xml",
        "/og/a1b2c3d4.jpg",
        "/pagefind/pagefind.js",
        // 非站内绝对路径一律不动
        "//cdn.example.com/x/",
        "https://example.com/posts/x/",
        "posts/x/",
        "../posts/x/",
        "#section",
        "?q=1",
        "/unknown",
    ])("leaves %s untouched", (href) => {
        expect(normalizeRouteHref(href)).toBe(href);
    });

    it("rewrites content-authored anchors in a parsed document", () => {
        const document = parse(
            '<p><a href="/posts/x">a</a><a href="/posts/x.md">b</a><a href="https://e.com/y/">c</a></p>',
        );
        expect(normalizeRouteHrefs(document)).toBe(1);
        expect(normalizeRouteHrefs(document)).toBe(0);
    });
});
