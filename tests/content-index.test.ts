import { describe, expect, it, vi } from "vitest";

const { getCollectionMock } = vi.hoisted(() => ({ getCollectionMock: vi.fn() }));
vi.mock("astro:content", () => ({ getCollection: getCollectionMock }));

import { buildPostContentIndex, getPostContentIndex } from "../src/utils/content-index";

interface TestPost {
    id: string;
    data: {
        abbrlink: string;
        date: string;
        updated?: string;
        tags?: string[];
        categories?: string[];
    };
}

function post(id: string, overrides: Partial<TestPost["data"]> = {}): TestPost {
    return {
        id,
        data: {
            abbrlink: id,
            date: "2026-01-01T00:00:00.000Z",
            ...overrides,
        },
    };
}

describe("post content index", () => {
    it("handles an empty collection", () => {
        const index = buildPostContentIndex<TestPost>([]);
        expect(index.posts).toEqual([]);
        expect(index.byAbbrlink.size).toBe(0);
        expect(index.tags.size).toBe(0);
        expect(index.categories.size).toBe(0);
    });

    it("indexes one post and leaves both neighbors empty", () => {
        const only = post("only", { tags: ["Astro"], categories: ["Engineering"] });
        const index = buildPostContentIndex([only]);
        expect(index.byAbbrlink.get("only")).toBe(only);
        expect(index.neighbors.get("only")).toEqual({ previous: undefined, next: undefined });
        expect(index.tags.get("Astro")?.posts).toEqual([only]);
    });

    it("sorts newest first and computes previous and next once", () => {
        const old = post("old", { date: "2024-01-01" });
        const middle = post("middle", { date: "2025-01-01" });
        const newest = post("new", { date: "2026-01-01" });
        const index = buildPostContentIndex([old, newest, middle]);
        expect(index.posts.map(({ id }) => id)).toEqual(["new", "middle", "old"]);
        expect(index.neighbors.get("middle")).toEqual({ previous: old, next: newest });
        expect(index.neighbors.get("new")).toEqual({ previous: middle, next: undefined });
        expect(index.neighbors.get("old")).toEqual({ previous: undefined, next: middle });
    });

    it("deduplicates repeated Unicode taxonomy values within one post", () => {
        const first = post("first", {
            tags: ["中文", "中文", "Astro"],
            categories: ["工程", "工程"],
        });
        const second = post("second", { date: "2025-01-01", tags: ["中文"] });
        const index = buildPostContentIndex([first, second]);
        expect(index.tags.get("中文")?.posts).toEqual([first, second]);
        expect(index.categories.get("工程")?.posts).toEqual([first]);
    });

    it("tracks a taxonomy latest update and deterministic cache key", () => {
        const first = post("first", {
            date: "2025-01-01",
            updated: "2026-03-01",
            tags: ["shared"],
        });
        const second = post("second", { date: "2026-01-01", tags: ["shared"] });
        const bucket = buildPostContentIndex([first, second]).tags.get("shared");
        expect(bucket?.latestTime).toBe("2026-03-01");
        expect(bucket?.cacheKey).toBe("2026-01-01|2026-03-01");
    });

    it("keeps invalid dates deterministic without crashing", () => {
        const invalid = post("invalid", { date: "not-a-date", tags: ["edge"] });
        const valid = post("valid", { date: "2026-01-01", tags: ["edge"] });
        const index = buildPostContentIndex([invalid, valid]);
        expect(index.posts.map(({ id }) => id)).toEqual(["valid", "invalid"]);
        expect(index.tags.get("edge")?.latestTime).toBe("2026-01-01");
    });

    it("fails fast when two posts would generate the same public route", () => {
        expect(() =>
            buildPostContentIndex([
                post("one", { abbrlink: "duplicate" }),
                post("two", {
                    abbrlink: "duplicate",
                }),
            ]),
        ).toThrow("Duplicate post abbrlink: duplicate");
    });

    it("builds a large index in one pass after sorting", () => {
        const posts = Array.from({ length: 1_000 }, (_, index) =>
            post(`post-${index}`, {
                date: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
                tags: [`tag-${index % 10}`],
                categories: [`category-${index % 5}`],
            }),
        );
        const index = buildPostContentIndex(posts);
        expect(index.posts).toHaveLength(1_000);
        expect(index.tags.size).toBe(10);
        expect(index.categories.size).toBe(5);
        expect(index.tags.get("tag-0")?.posts).toHaveLength(100);
    });

    it("reloads the collection in the test development environment", async () => {
        getCollectionMock.mockResolvedValue([post("from-collection")]);
        const first = await getPostContentIndex();
        const second = await getPostContentIndex();
        expect(first.posts[0]?.data.abbrlink).toBe("from-collection");
        expect(second.posts[0]?.data.abbrlink).toBe("from-collection");
        expect(getCollectionMock).toHaveBeenCalledTimes(2);
    });
});
