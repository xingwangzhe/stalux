import { afterEach, describe, expect, it, vi } from "vitest";
import { createOramaIndex } from "../src/internal/orama-search-index";

type Tool = {
    name: string;
    execute: (
        input: Record<string, unknown>,
        options?: { signal?: AbortSignal },
    ) => Promise<Record<string, unknown>>;
};
const state = vi.hoisted(() => ({
    tools: new Map<string, Tool>(),
    mount: undefined as undefined | (() => () => void),
    loadOrama: vi.fn(),
}));
vi.mock("@w3c/webmcp-polyfill", () => ({ installWebMCP: vi.fn() }));
vi.mock("../src/scripts/orama-api", () => ({ loadOrama: state.loadOrama }));
vi.mock("../src/scripts/page-runtime", () => ({
    registerPageLifecycle: (_key: string, mount: () => () => void) => {
        state.mount = mount;
    },
}));

const posts = [
    {
        title: "First article",
        abbrlink: "a",
        tags: ["Astro"],
        categories: ["Web"],
        desc: "First description",
        url: "/posts/a/",
    },
    { title: "中文文章", abbrlink: "b", tags: [], categories: [], desc: "介绍", url: "/posts/b/" },
];
const json = (data: unknown) =>
    new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
let cleanup: (() => void) | undefined;
async function setup(markdownExport = true) {
    state.tools.clear();
    const document = {
        documentElement: { lang: "zh-CN" },
        body: {
            dataset: {
                staluxSiteTitle: "Test Blog",
                staluxSiteUrl: "https://blog.test",
                staluxSiteLang: "zh-CN",
                staluxMarkdownExport: String(markdownExport),
            },
        },
        modelContext: {
            registerTool: async (tool: Tool) => {
                state.tools.set(tool.name, tool);
            },
        },
    };
    const fetcher = vi.fn(async (url: string) =>
        url.endsWith("posts.json")
            ? json(posts)
            : new Response("# Article\n中文", { headers: { "Content-Type": "text/markdown" } }),
    );
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {});
    vi.stubGlobal("location", new URL("https://blog.test/posts/a/"));
    vi.stubGlobal("fetch", fetcher);
    await import("../src/scripts/webmcp");
    cleanup = state.mount?.();
    for (let i = 0; i < 20; i++) await Promise.resolve();
    expect(state.tools.size).toBe(7);
    return { fetcher, document };
}
function call(name: string, input: Record<string, unknown> = {}) {
    const tool = state.tools.get(`stalux_${name}`);
    if (!tool) throw new Error(`Missing tool ${name}`);
    return tool.execute(input);
}
afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.unstubAllGlobals();
    vi.resetModules();
    state.loadOrama.mockReset();
});

describe("static blog WebMCP tools", () => {
    it("uses the Orama artifact for body search and exact article reads, and respects the off switch", async () => {
        const { fetcher } = await setup(false);
        const { loadOrama } = await vi.importActual<typeof import("../src/scripts/orama-api")>(
            "../src/scripts/orama-api",
        );
        state.loadOrama.mockImplementation(loadOrama);
        vi.stubGlobal("__STALUX_ORAMA_ENABLED__", false);
        expect(await call("search_posts", { keyword: "Astro" })).toMatchObject({
            source: "metadata",
            fullText: false,
        });
        expect(fetcher.mock.calls.every(([url]) => url.endsWith("posts.json"))).toBe(true);

        const bytes = await createOramaIndex(
            [
                {
                    url: "/posts/a/",
                    post: "a",
                    language: "zh-cn",
                    title: "First article",
                    description: "",
                    keywords: "",
                    content: "正文里写了一看好家伙",
                    published: 1,
                },
            ],
            true,
        );
        vi.stubGlobal("__STALUX_ORAMA_ENABLED__", true);
        fetcher.mockResolvedValueOnce(new Response(null, { status: 503 }));
        expect(await call("search_posts", { keyword: "好家伙" })).toMatchObject({
            ok: false,
            code: "INDEX_UNAVAILABLE",
        });
        fetcher.mockResolvedValueOnce(new Response(bytes));
        expect(await call("search_posts", { keyword: "好家伙" })).toMatchObject({
            ok: true,
            source: "orama+metadata",
            fullText: true,
            posts: [{ abbrlink: "a" }],
        });
        expect(await call("read_post", { id: "a" })).toMatchObject({
            ok: true,
            format: "text/plain",
            content: "正文里写了一看好家伙",
        });
        expect(fetcher.mock.calls.filter(([url]) => url.endsWith("/orama/index.bin"))).toHaveLength(
            2,
        );
    });

    it("labels metadata-only search when the full-text index is unavailable", async () => {
        state.loadOrama.mockResolvedValue(null);
        await setup();
        expect(await call("search_posts", { keyword: "Astro" })).toMatchObject({
            ok: true,
            source: "metadata",
            fullText: false,
            posts: [{ abbrlink: "a" }],
        });
    });
    it("executes all seven tools using static metadata, Markdown and real Orama field names", async () => {
        const search = vi.fn().mockResolvedValue([
            { document: { post: "", url: "/about/", title: "About", content: "" } },
            {
                document: {
                    post: "a",
                    url: "/posts/a/",
                    title: "Orama title",
                    content: "Plain excerpt",
                },
            },
        ]);
        state.loadOrama.mockResolvedValue({ search });
        const { fetcher } = await setup();
        expect(await call("list_posts", { page: 100, pageSize: 1 })).toMatchObject({
            ok: true,
            page: 2,
            total: 2,
            clamped: true,
        });
        expect(await call("get_post", { id: "Astro" })).toMatchObject({
            ok: true,
            post: { abbrlink: "a", url: "https://blog.test/posts/a/" },
        });
        expect(await call("current_post")).toMatchObject({ ok: true, post: { abbrlink: "a" } });
        expect(await call("random_post")).toMatchObject({ ok: true });
        expect(await call("search_posts", { keyword: "needle", limit: 1 })).toMatchObject({
            ok: true,
            count: 1,
            posts: [
                {
                    abbrlink: "a",
                    title: "Orama title",
                    excerpt: "Plain excerpt",
                    url: "https://blog.test/posts/a/",
                },
            ],
        });
        expect(await call("read_post", { id: "a" })).toMatchObject({
            ok: true,
            format: "text/markdown",
            markdown: "# Article\n中文",
            truncated: false,
            nextOffset: null,
        });
        expect(await call("site_info")).toMatchObject({
            ok: true,
            title: "Test Blog",
            transport: "WebMCP",
            markdownExport: true,
            llms: "https://blog.test/llms.txt",
        });
        expect(fetcher.mock.calls.filter(([url]) => url.endsWith("posts.json"))).toHaveLength(1);
    });

    it("reads the exact Orama article when Markdown exports are disabled", async () => {
        const search = vi
            .fn()
            .mockResolvedValue([
                { document: { post: "a", url: "/posts/a/", content: "Indexed plain text" } },
            ]);
        state.loadOrama.mockResolvedValue({ search });
        const { fetcher } = await setup(false);
        expect(await call("read_post", { id: "a" })).toMatchObject({
            ok: true,
            format: "text/plain",
            content: "Indexed plain text",
            url: "https://blog.test/posts/a/",
        });
        expect(search).toHaveBeenCalledWith("", "a");
        expect(fetcher.mock.calls.every(([url]) => url.endsWith("posts.json"))).toBe(true);
    });

    it("retries metadata after a network failure and rejects malformed indexes", async () => {
        const { fetcher } = await setup();
        fetcher.mockRejectedValueOnce(new Error("offline"));
        expect(await call("list_posts")).toMatchObject({ ok: false, code: "INDEX_UNAVAILABLE" });
        fetcher.mockResolvedValueOnce(json([{ title: 42 }]));
        expect(await call("list_posts")).toMatchObject({ ok: false, code: "INDEX_UNAVAILABLE" });
        expect(await call("list_posts")).toMatchObject({ ok: true, total: 2 });
    });

    it("paginates long content without silently truncating or splitting surrogate pairs", async () => {
        const { fetcher } = await setup();
        const body = `${"a".repeat(49999)}😀end`;
        fetcher.mockImplementation(async (url: string) =>
            url.endsWith("posts.json")
                ? json(posts)
                : new Response(body, { headers: { "Content-Type": "text/markdown" } }),
        );
        const first = await call("read_post", { id: "a" });
        expect(first).toMatchObject({
            ok: true,
            totalChars: 50004,
            truncated: true,
            nextOffset: 49999,
        });
        expect((first.markdown as string).length).toBe(49999);
        expect(await call("read_post", { id: "a", offset: first.nextOffset })).toMatchObject({
            ok: true,
            markdown: "😀end",
            truncated: false,
            nextOffset: null,
        });
        expect(await call("read_post", { id: "a", offset: 50000 })).toMatchObject({
            ok: false,
            code: "BAD_INPUT",
        });
    });

    it("rejects invalid parameters and IDs without fetching arbitrary paths", async () => {
        const { fetcher } = await setup();
        for (const [name, input] of [
            ["list_posts", { page: 1.2 }],
            ["list_posts", { pageSize: Number.POSITIVE_INFINITY }],
            ["list_posts", { toString: "unknown" }],
            ["get_post", { id: { nested: true } }],
            ["search_posts", { keyword: "ok", limit: -1 }],
            ["read_post", { id: "a", offset: -1 }],
        ] as Array<[string, Record<string, unknown>]>)
            expect(await call(name, input)).toMatchObject({ ok: false, code: "BAD_INPUT" });
        expect(fetcher).not.toHaveBeenCalled();
        expect(await call("read_post", { id: "../private" })).toMatchObject({
            ok: false,
            code: "NOT_FOUND",
        });
        expect(fetcher).toHaveBeenCalledTimes(1);
        vi.stubGlobal("location", new URL("https://blog.test/posts/%E0%A4%A/"));
        expect(await call("current_post")).toMatchObject({ ok: false, code: "NOT_ON_POST_PAGE" });
    });

    it("reports Orama search failures and refuses HTML fallbacks masquerading as Markdown", async () => {
        const { fetcher } = await setup();
        state.loadOrama.mockResolvedValue({
            search: vi.fn().mockRejectedValue(new Error("search failed")),
        });
        expect(await call("search_posts", { keyword: "test" })).toMatchObject({
            ok: false,
            code: "SEARCH_FAILED",
        });
        fetcher.mockImplementation(async (url: string) =>
            url.endsWith("posts.json")
                ? json(posts)
                : new Response("<html>Not markdown</html>", {
                      headers: { "Content-Type": "text/html" },
                  }),
        );
        expect(await call("read_post", { id: "a" })).toMatchObject({
            ok: false,
            code: "CONTENT_UNAVAILABLE",
        });
        state.loadOrama.mockResolvedValue(null);
        expect(await call("search_posts", { keyword: "test" })).toMatchObject({
            ok: false,
            code: "INDEX_UNAVAILABLE",
        });
    });

    it("aborts an active Markdown request when its page is disposed", async () => {
        const { fetcher } = await setup();
        fetcher.mockImplementation(async (url: string, options?: RequestInit) => {
            if (url.endsWith("posts.json")) return json(posts);
            return new Promise<Response>((_resolve, reject) => {
                options?.signal?.addEventListener("abort", () => reject(options.signal?.reason), {
                    once: true,
                });
            });
        });
        const pending = call("read_post", { id: "a" });
        const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
        for (let i = 0; i < 20; i++) await Promise.resolve();
        cleanup?.();
        await assertion;
    });
});
