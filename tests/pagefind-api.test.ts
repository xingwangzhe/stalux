import { describe, expect, it, vi } from "vitest";
import { createPagefindLoader } from "../src/scripts/pagefind-api";
import { sitePath } from "../src/utils/site-path";

describe("static Pagefind loader", () => {
    it("shares successful and in-flight work under the deployment base", async () => {
        const api = { search: vi.fn() };
        const importer = vi.fn().mockResolvedValue(api);
        const load = createPagefindLoader(importer, () => "https://blog.test", "/blog/");
        const first = load();
        expect(load()).toBe(first);
        expect(await first).toBe(api);
        expect(await load()).toBe(api);
        expect(importer).toHaveBeenCalledOnce();
        expect(importer).toHaveBeenCalledWith("https://blog.test/blog/pagefind/pagefind.js");
        expect(sitePath("/api/posts.json", "/blog/")).toBe("/blog/api/posts.json");
    });
    it("retries failed or malformed imports", async () => {
        const output = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const api = { search: vi.fn() };
            const importer = vi
                .fn()
                .mockRejectedValueOnce(new Error("offline"))
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ default: api });
            const load = createPagefindLoader(importer, () => "https://blog.test", "/");
            expect(await load()).toBeNull();
            expect(await load()).toBeNull();
            expect(await load()).toBe(api);
            expect(importer).toHaveBeenCalledTimes(3);
            expect(importer.mock.calls.map(([url]) => url)).toEqual([
                "https://blog.test/pagefind/pagefind.js",
                "https://blog.test/pagefind/pagefind.js?stalux_retry=1",
                "https://blog.test/pagefind/pagefind.js?stalux_retry=2",
            ]);
        } finally {
            output.mockRestore();
        }
    });
});
