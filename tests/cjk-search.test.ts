import { describe, expect, it, vi } from "vitest";
import { extractCjkDocument } from "../src/internal/cjk-search-index";
import { createEnhancedSearch, type NativeSearch } from "../src/scripts/search-engine";
import { cjkGrams, gramShard } from "../src/utils/cjk-search";

const page = (id: string) => ({
    id,
    data: async () => ({ url: `/posts/${id}/`, meta: { title: id } }),
});
function fixture(
    content = "解决国外人机验证不显示问题 Google reCAPTCHA 人机身份验证",
    title = "解决国外人机验证不显示问题",
    lang = "zh-CN",
) {
    const record = {
        url: "/posts/37f315ff/",
        title,
        description: "Google reCAPTCHA 人机验证",
        keywords: "验证码",
        language: lang,
        filters: { post: ["37f315ff"] },
        file: "text.json",
    };
    const shards: Record<string, string> = {};
    const files: Record<string, unknown> = { "text.json": { content } };
    for (const gram of cjkGrams(content)) {
        const file = `${gramShard(gram)}.json`;
        shards[gramShard(gram)] = file;
        files[file] ??= {};
        const posting = files[file] as Record<string, number[]>;
        posting[gram] = [0];
    }
    files["manifest.json"] = { documents: [record], shards };
    const request = vi.fn(
        async (url: string | URL | Request) =>
            new Response(JSON.stringify(files[String(url).split("/").at(-1) as string])),
    );
    const native: NativeSearch = {
        search: vi.fn(async (query) => ({
            results:
                query === null ? [page("native-target")] : [page("native-target"), page("other")],
        })),
        options: vi.fn(),
        filters: vi.fn(),
        mergeIndex: vi.fn(),
    };
    return {
        engine: createEnhancedSearch(
            Promise.resolve(native),
            "/blog/",
            request as typeof fetch,
            () => "zh-CN",
        ),
        request,
        native,
    };
}

describe("CJK search across real index boundaries", () => {
    it("indexes title, summary, keywords and inline text without indexing UI or scripts", () => {
        const record = extractCjkDocument(
            `<html lang="zh-CN"><h1 data-pagefind-body>解决国外人机验证不显示问题</h1><p data-pagefind-body data-stalux-search-description>Google reCAPTCHA</p><span data-pagefind-body data-stalux-search-keywords data-search-keywords="验证码" data-pagefind-index-attrs="data-search-keywords"></span><section data-pagefind-body>人<em>机</em>身份验证<p data-pagefind-ignore>评论秘密</p><script>脚本秘密</script><template>模板秘密</template></section><nav>导航秘密</nav></html>`,
            "/posts/37f315ff/",
        );
        expect(record?.content).toContain("人机身份验证");
        expect(record?.content).toContain("验证码");
        expect(record?.title).toBe("解决国外人机验证不显示问题");
        expect(record?.content).not.toContain("秘密");
        expect(extractCjkDocument("<html><p>not indexed</p></html>", "/")).toBeNull();
    });
    it.each(["人机验证", "验证不显示", "机验", "验", "人机 验证", "Ｇｏｏｇｌｅ 人机验证"])(
        "finds %s and deduplicates existing native hits",
        async (query) => {
            const { engine, request } = fixture();
            const result = await engine.search(query);
            expect(result.results.map((hit) => hit.id)).toEqual(["native-target", "other"]);
            expect((await result.results[0]?.data())?.meta?.title).toBe(
                "解决国外人机验证不显示问题",
            );
            expect(
                request.mock.calls.every(([url]) => String(url).startsWith("/blog/pagefind/cjk/")),
            ).toBe(true);
        },
    );
    it("checks consecutive text after ngram recall and retains native results", async () => {
        const { engine } = fixture("人机测试 机验测试 验证测试");
        const result = await engine.search("人机验证");
        expect((await result.results[0]?.data())?.meta?.title).toBe("native-target");
    });
    it("escapes HTML in a supplemental excerpt", async () => {
        const { engine } = fixture("人机验证 <img src=x onerror=alert(1)>");
        const data = await (await engine.search("人机验证")).results[0]?.data();
        expect(data?.excerpt).toContain("<mark>人机验证</mark>");
        expect(data?.excerpt).toContain("&lt;img");
        expect(data?.excerpt).not.toContain("<img");
    });
    it("preserves null, quoted, Latin-only and filtered query semantics", async () => {
        const { engine, request, native } = fixture();
        await engine.search(null, { filters: { post: "37f315ff" } });
        await engine.search('"人机验证"');
        await engine.search("C++");
        await engine.search("人机验证", { filters: { post: ["other"] } });
        expect(request).not.toHaveBeenCalled();
        expect(native.search).toHaveBeenCalledWith(null, { filters: { post: "37f315ff" } });
    });
    it("does not mix language indexes", async () => {
        const { engine } = fixture("人机验证", "日文页面", "ja");
        expect((await (await engine.search("人机验证")).results[0]?.data())?.meta?.title).toBe(
            "native-target",
        );
    });
    it.each(["東京都検索", "ひらがな検索", "カタカナ検索", "한국어검색"])(
        "generates substring grams for %s",
        (text) => {
            expect(cjkGrams(text)).toContain([...text].slice(1, 3).join(""));
        },
    );
    it("retries a failed companion request without losing native search", async () => {
        const { engine, request } = fixture();
        request.mockRejectedValueOnce(new Error("offline"));
        expect((await (await engine.search("人机验证")).results[0]?.data())?.meta?.title).toBe(
            "native-target",
        );
        expect((await (await engine.search("人机验证")).results[0]?.data())?.meta?.title).toBe(
            "解决国外人机验证不显示问题",
        );
    });
});

it("retains raw-query hits as well as normalized-query hits", async () => {
    const { engine, native } = fixture();
    native.search = vi.fn(async (query) => ({
        results:
            query === null
                ? [page("native-target")]
                : query?.startsWith("Ｇ")
                  ? [page("raw-only")]
                  : [page("normalized-only")],
    }));
    const results = await engine.search("Ｇｏｏｇｌｅ 人机验证");
    expect(results.results.map((result) => result.id)).toEqual([
        "native-target",
        "raw-only",
        "normalized-only",
    ]);
});
