import { describe, expect, it, vi } from "vitest";

vi.mock("../src/scripts/page-runtime", () => ({ registerPageLifecycle: vi.fn() }));
vi.mock("../src/scripts/logger", () => ({
    createClientLogger: () => ({ debug: vi.fn(), warn: vi.fn() }),
}));

import { collectMainRouteUrls } from "../src/scripts/route-prefetch";

function documentWith(hrefs: string[]) {
    return {
        querySelectorAll: () => hrefs.map((href) => ({ href })),
    } as unknown as Pick<Document, "querySelectorAll">;
}

describe("main route prefetch URLs", () => {
    it("keeps internal navigation routes and removes the current page", () => {
        const current = new URL("https://example.org/");
        const urls = collectMainRouteUrls(
            documentWith([
                "https://example.org/",
                "https://example.org/archives/",
                "https://example.org/tags/",
                "https://example.org/about/#contact",
                "https://external.example/blog",
                "mailto:someone@example.org",
            ]),
            current,
        );
        expect(urls).toEqual(["/archives/", "/tags/", "/about/"]);
    });

    it("deduplicates repeated links and preserves query strings", () => {
        const current = new URL("https://example.org/");
        const urls = collectMainRouteUrls(
            documentWith([
                "https://example.org/archives/",
                "https://example.org/archives/",
                "https://example.org/categories/?view=grid",
            ]),
            current,
        );
        expect(urls).toEqual(["/archives/", "/categories/?view=grid"]);
    });

    it("skips malformed navigation links without aborting the rest", () => {
        const current = new URL("https://example.org/");
        const urls = collectMainRouteUrls(
            documentWith(["http://[invalid", "https://example.org/words/"]),
            current,
        );
        expect(urls).toEqual(["/words/"]);
    });
});
