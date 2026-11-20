import { insert } from "@orama/orama";
import { expect, it } from "vitest";
import { extractSearchDocument } from "../src/internal/orama-search-index";
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

it("extracts only the indexed article and its publication data", () => {
    const record = extractSearchDocument(
        `<html lang="zh-CN"><article data-pagefind-sort="published:4"><h1 data-pagefind-body>Astro</h1><section data-pagefind-body data-stalux-post-id="example">正文 <b>关键词</b><span data-pagefind-ignore>不收录</span></section></article></html>`,
        "/posts/example",
    );
    expect(record).toMatchObject({
        post: "example",
        published: 4,
        language: "zh-cn",
        content: "Astro 正文 关键词",
    });
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
