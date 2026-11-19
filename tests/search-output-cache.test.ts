import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createSearchOutputCache } from "../src/internal/search-output-cache";

it("restores exact indexes and rejects changed HTML, versions or damaged files", async () => {
    const root = await mkdtemp(join(tmpdir(), "stalux-search-output-"));
    try {
        const cacheDir = join(root, "cache");
        const outDir = join(root, "dist");
        const index = join(outDir, "pagefind");
        const page = join(outDir, "index.html");
        await mkdir(join(index, "cjk"), { recursive: true });
        await Bun.write(page, "first article");
        await Bun.write(join(index, "pagefind.js"), "native");
        await Bun.write(join(index, "cjk", "manifest.json"), "substrings");
        const create = (buildKey = "v1") =>
            createSearchOutputCache(cacheDir, outDir, ["index.html"], buildKey);
        await (await create()).save();
        await rm(index, { recursive: true });
        expect(await (await create("v2")).restore()).toBe(false);
        await Bun.write(page, "second article");
        expect(await (await create()).restore()).toBe(false);
        await Bun.write(page, "first article");
        expect(await (await create()).restore()).toBe(true);
        expect(await Bun.file(join(index, "pagefind.js")).text()).toBe("native");
        expect(await Bun.file(join(index, "cjk", "manifest.json")).text()).toBe("substrings");
        await rm(index, { recursive: true });
        await Bun.write(join(cacheDir, "latest", "pagefind", "pagefind.js"), "broken");
        expect(await (await create()).restore()).toBe(false);
        expect(await Bun.file(join(index, "pagefind.js")).exists()).toBe(false);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
