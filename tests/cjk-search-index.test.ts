import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { writeCjkSearchIndex } from "../src/internal/cjk-search-index";
import { type CjkManifest, gramShard } from "../src/utils/cjk-search";

describe("published CJK index artifacts", () => {
    it("writes real hashed shards and document text under the deployment base", async () => {
        const directory = await mkdtemp(path.join(tmpdir(), "stalux-cjk-"));
        try {
            await mkdir(path.join(directory, "posts", "example"), { recursive: true });
            await writeFile(
                path.join(directory, "posts", "example", "index.html"),
                '<html lang="zh-CN"><title>Fallback title</title><h1 data-pagefind-body>人机验证</h1><section data-pagefind-body data-pagefind-filter="post[data-stalux-post-id]" data-stalux-post-id="example">人机身份验证<span data-pagefind-ignore>秘密</span></section><span data-pagefind-body data-stalux-search-keywords data-pagefind-index-attrs="data-search-keywords" data-search-keywords="机器人校验"></span></html>',
            );
            await writeFile(
                path.join(directory, "index.html"),
                "<html><h1>not searchable</h1></html>",
            );
            expect(
                await writeCjkSearchIndex(
                    directory,
                    ["posts/example/index.html", "index.html"],
                    "/blog/",
                ),
            ).toBe(1);
            const location = path.join(directory, "pagefind", "cjk");
            const manifest: CjkManifest = JSON.parse(
                await readFile(path.join(location, "manifest.json"), "utf8"),
            );
            const record = manifest.documents[0];
            expect(record?.url).toBe("/blog/posts/example/");
            expect(record?.title).toBe("人机验证");
            expect(record?.filters.post).toEqual(["example"]);
            expect(record?.file).toMatch(/^[a-f\d]{20}\.json$/u);
            const text = JSON.parse(
                await readFile(path.join(location, record?.file ?? ""), "utf8"),
            );
            expect(text.content).toContain("机器人校验");
            expect(text.content).not.toContain("秘密");
            const shard = JSON.parse(
                await readFile(
                    path.join(location, manifest.shards[gramShard("机验")] ?? ""),
                    "utf8",
                ),
            );
            expect(shard["机验"]).toEqual([0]);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
