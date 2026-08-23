import { describe, expect, it } from "vitest";

import { createInjectedRoutes } from "../src/internal/injected-routes";
import {
    getMarkdownPath,
    getRouteKind,
    normalizePublicPath,
    toPublicUrl,
} from "../src/utils/public-routes";

describe("public route catalog", () => {
    it.each([
        ["/", "home"],
        ["/archives/", "archive"],
        ["/links", "links"],
        ["/words/", "words"],
        ["/about", "about"],
        ["/tags", "tags-index"],
        ["/tags/Astro", "tags-detail"],
        ["/categories", "categories-index"],
        ["/categories/Theme", "categories-detail"],
        ["/posts/a1b2c3d4/", "article"],
        ["/404", "not-found"],
        ["/unknown", "other"],
    ] as const)("classifies %s as %s", (path, kind) => {
        expect(getRouteKind(path)).toBe(kind);
    });

    it("normalizes trailing slashes, query strings, and fragments", () => {
        expect(normalizePublicPath("/tags///?page=1#top")).toBe("/tags");
        expect(normalizePublicPath("///")).toBe("/");
    });

    it.each([
        ["/", "/index.md"],
        ["/about/", "/about.md"],
        ["/archives", "/archives.md"],
        ["/tags", "/tags/index.md"],
        ["/categories/", "/categories/index.md"],
        ["/tags/Astro", "/tags/Astro.md"],
        ["/categories/Theme", "/categories/Theme.md"],
        ["/posts/a1b2c3d4/", "/posts/a1b2c3d4.md"],
        ["/404", undefined],
    ])("maps %s to its real Markdown endpoint", (path, markdown) => {
        expect(getMarkdownPath(path)).toBe(markdown);
    });

    it("builds canonical HTML and Markdown URLs from one path rule", () => {
        expect(toPublicUrl("https://example.com/", "/tags", false)).toBe(
            "https://example.com/tags/",
        );
        expect(toPublicUrl("https://example.com/", "/tags", true)).toBe(
            "https://example.com/tags/index.md",
        );
        expect(toPublicUrl("https://example.com/", "/404", true)).toBe("https://example.com/404/");
    });

    it("creates every plugin route from the package base", () => {
        const routes = createInjectedRoutes(new URL("file:///tmp/stalux/src/"));
        expect(routes).toHaveLength(28);
        expect(routes).toContainEqual({
            pattern: "/tags/index.md",
            entrypoint: "/tmp/stalux/src/pages/tags/index.md.ts",
        });
        expect(new Set(routes.map((route) => route.pattern)).size).toBe(routes.length);
    });
});
