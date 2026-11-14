import type { CollectionEntry } from "astro:content";
import { describe, expect, it, vi } from "vitest";

import { siteSchema } from "../src/schemas/config";
import { buildFeedItems } from "../src/utils/feed";

vi.mock("../src/utils/word-count-utils", () => ({
    getPostDescriptions: vi.fn(async () => new Map()),
}));

function post(abbrlink: string, date: string): CollectionEntry<"posts"> {
    return {
        data: {
            abbrlink,
            title: abbrlink,
            date,
            desc: `${abbrlink} description`,
            categories: [],
        },
    } as unknown as CollectionEntry<"posts">;
}

describe("feed post limit", () => {
    it("returns the newest posts up to the configured limit", async () => {
        const items = await buildFeedItems(
            { timezone: "Asia/Shanghai", rss: { limit: 2 } },
            [
                post("oldest", "2026-11-01 08:00:00"),
                post("newest", "2026-11-03 08:00:00"),
                post("middle", "2026-11-02 08:00:00"),
            ],
            "atom:updated",
        );

        expect(items.map((item) => item.title)).toEqual(["newest", "middle"]);
    });

    it("keeps every post when the limit is omitted", async () => {
        const items = await buildFeedItems(
            { timezone: "Asia/Shanghai" },
            [post("older", "2026-11-01 08:00:00"), post("newer", "2026-11-02 08:00:00")],
            "updated",
        );

        expect(items).toHaveLength(2);
    });
});

describe("site.rss schema", () => {
    const site = {
        id: "site" as const,
        title: "Test",
        url: "https://example.com",
        description: "Test site",
    };

    it("accepts a positive integer limit", () => {
        expect(siteSchema.parse({ ...site, rss: { limit: 20 } }).rss?.limit).toBe(20);
    });

    it("rejects zero and fractional limits", () => {
        expect(() => siteSchema.parse({ ...site, rss: { limit: 0 } })).toThrow();
        expect(() => siteSchema.parse({ ...site, rss: { limit: 2.5 } })).toThrow();
    });
});
