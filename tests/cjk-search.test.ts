import { insert } from "@orama/orama";
import { expect, it } from "vitest";
import { createOramaIndex, searchablePostBody } from "../src/internal/orama-search-index";
import { createSearchIndex, searchDocuments, searchVector } from "../src/utils/orama-search";

it("matches continuous CJK terms and preserves publication order and post lookup", async () => {
    const index = createSearchIndex(true);
    for (const [post, published, content] of [
        ["older", 1, "一看好家伙，这里要注意"],
        ["newer", 2, "好家伙，也没有出现问题"],
        ["unrelated", 3, "好，我们和那伙人先走"],
    ] as const) {
        insert(index, {
            post,
            url: "/posts/" + post,
            language: "zh-cn",
            title: content,
            description: "",
            keywords: "",
            content,
            published,
            embedding: searchVector(content, true),
        });
    }
    const options = { cjk: true, language: "zh-cn", limit: 10 };
    expect(
        (await searchDocuments(index, "好家伙", options)).map(({ document }) => document.post),
    ).toEqual(["newer", "older"]);
    expect(
        (await searchDocuments(index, "一看好家伙", options)).map(({ document }) => document.post),
    ).toEqual(["older"]);
    expect(
        (await searchDocuments(index, "", { ...options, post: "older" })).map(
            ({ document }) => document.post,
        ),
    ).toEqual(["older"]);
});

it("indexes rendered collection content as plain text", () => {
    expect(
        searchablePostBody(
            "<p>好<strong>家伙</strong></p><p>后续</p><span data-pagefind-ignore>不收录</span>",
            undefined,
        ),
    ).toBe("好家伙 后续");
    expect(searchablePostBody(undefined, "好**家伙** `Astro`")).toBe("好家伙 Astro");
});

it("writes a reproducible search index with stable document IDs", async () => {
    const url = "/posts/example/";
    const documents = [
        {
            url,
            post: "example",
            language: "zh-cn",
            title: "好家伙",
            description: "",
            keywords: "",
            content: "正文",
            published: 1,
        },
    ];
    const first = await createOramaIndex(documents, true);
    expect(await createOramaIndex(documents, true)).toEqual(first);
    const artifact = JSON.parse(new TextDecoder().decode(Bun.gunzipSync(first)));
    expect(artifact.data.internalDocumentIDStore.internalIdToId).toEqual([url]);
});

it("can turn off CJK indexing while preserving technical terms", async () => {
    const index = createSearchIndex(false);
    const content = "全文搜索 C++";
    insert(index, {
        post: "post",
        url: "/posts/post",
        language: "zh-cn",
        title: content,
        description: "",
        keywords: "",
        content,
        published: 1,
        embedding: searchVector(content, false),
    });
    const options = { cjk: false, language: "zh-cn", limit: 10 };
    expect(await searchDocuments(index, "全文", options)).toHaveLength(0);
    expect(await searchDocuments(index, "C++", options)).toHaveLength(1);
});
