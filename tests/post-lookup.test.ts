import { describe, expect, it } from "vitest";
import { createPostLookup } from "../src/utils/post-lookup";

describe("post metadata lookup", () => {
    it("finds bounded title/tag/category/description matches with title priority", () => {
        const posts = [
            { abbrlink: "tag", title: "Other", tags: ["LINUX"] },
            { abbrlink: "title", title: "Linux notes" },
            { abbrlink: "category", title: "Desktop", categories: ["Linux"] },
            { abbrlink: "description", title: "Setup", desc: "Install Linux" },
        ];
        const lookup = createPostLookup(posts);
        expect(lookup.findMatches("LiNuX", 2)).toEqual([posts[1], posts[0]]);
        expect(lookup.findMatches("linux", 10)).toEqual([posts[1], posts[0], posts[2], posts[3]]);
        expect(lookup.findMatches("missing", 10)).toEqual([]);
    });
    it("preserves strict IDs, first duplicates, and title priority over earlier tag matches", () => {
        const posts = [
            { abbrlink: "1", title: "First", tags: ["LINUX", "中文"] },
            { abbrlink: "2", title: "Linux notes", tags: [] },
            { abbrlink: "1", title: "Duplicate", tags: [] },
        ];
        const lookup = createPostLookup(posts);
        expect(lookup.findById("1")).toBe(posts[0]);
        expect(lookup.findById("01")).toBeUndefined();
        expect(lookup.findByKeyword("LiNuX")).toBe(posts[1]);
        expect(lookup.findByKeyword("中文")).toBe(posts[0]);
        expect(lookup.findByKeyword("")).toBe(posts[0]);
        expect(lookup.findByKeyword("missing")).toBeUndefined();
        expect(createPostLookup([]).findById("1")).toBeUndefined();
        expect(posts[0]?.tags).toEqual(["LINUX", "中文"]);
    });
});
