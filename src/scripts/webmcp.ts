/**
 * Stalux WebMCP 工具注册（纯前端，零后端）
 *
 * 遵循 W3C webmachinelearning/webmcp 草案：网页通过 document.modelContext
 * 向浏览器/代理注册工具。所有数据源均为构建期静态产物——
 * /api/posts.json（文章元信息索引）、/api/post.abbrlink.json（兼容列表）、
 * /posts/{id}.md（源码导出）、/llms.txt / /llms-full.txt（站点信息镜像）、
 * /pagefind/（全文索引）。
 *
 * 工具描述跟随站点语言（site.yml 的 lang）：中文站显示中文说明，
 * 英文站显示英文说明，保证 AI 代理与评审（如 webmcp.com）能读懂。
 *
 * 浏览器无原生 modelContext 时，由布局注入的 @mcp-b/webmcp-polyfill
 * 提供兜底实现；两者都没有则静默跳过注册，不影响普通访问者。
 *
 * Spec: https://github.com/webmachinelearning/webmcp
 */
// 浏览器无原生 document.modelContext 时由 polyfill 兜底安装；
// 有原生实现或已存在 WebMCP-aware 扩展时，polyfill 检测到后自动 no-op。
// 放在模块顶部 import，保证其副作用在下方注册逻辑执行前完成。
import "@mcp-b/webmcp-polyfill";

declare global {
    interface Window {
        __STALUX_SITE_INFO__?: {
            title?: string;
            url?: string;
            description?: string;
            lang?: string;
        };
    }
}

/** 规范（index.bs）中 ModelContextTool 字典的最小类型子集 */
interface WebMCPTool {
    name: string;
    title?: string;
    description: string;
    inputSchema?: object;
    annotations?: {
        readOnlyHint?: boolean;
        untrustedContentHint?: boolean;
    };
    execute: (input: Record<string, unknown>) => Promise<unknown>;
}

interface ModelContext {
    registerTool: (tool: WebMCPTool, options?: { signal?: AbortSignal }) => Promise<undefined>;
}

interface DocumentWithModelContext extends Document {
    modelContext?: ModelContext;
}

// ---------------------------------------------------------------------------
// 语言选择（跟随站点 site.yml 的 lang）
// ---------------------------------------------------------------------------

const SITE_LANG = (
    typeof window !== "undefined" ? (window.__STALUX_SITE_INFO__?.lang ?? "zh-CN") : "zh-CN"
).toLowerCase();

/** 站点为英文站时为 true */
const IS_EN = SITE_LANG === "en" || SITE_LANG === "en-us" || SITE_LANG === "en-gb";

/** 按站点语言选择文案：pick(中文, English) */
function pick(zh: string, en: string): string {
    return IS_EN ? en : zh;
}

// ---------------------------------------------------------------------------
// 工具执行辅助
// ---------------------------------------------------------------------------

/** 统一错误包装：返回结构化错误而非抛异常，便于 Agent 读取 */
function err(
    code: string,
    message: string,
    extra?: Record<string, unknown>,
): { ok: false; code: string; message: string } & Record<string, unknown> {
    return { ok: false, code, message, ...extra };
}

async function fetchJSON(url: string): Promise<unknown> {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    return r.json();
}

/** 动态加载 Pagefind 全文索引（仅首次调用，结果跨调用缓存） */
let pagefindLoadPromise: Promise<{ search: (q: string) => Promise<unknown> } | null> | null = null;
async function loadPagefind(): Promise<{ search: (q: string) => Promise<unknown> } | null> {
    if (!pagefindLoadPromise) {
        pagefindLoadPromise = (async () => {
            try {
                // @vite-ignore: pagefind 索引是构建期产物，不参与依赖打包
                const mod = await import(/* @vite-ignore */ "/pagefind/pagefind.js");
                return mod.default ?? mod;
            } catch {
                return null;
            }
        })();
    }
    return pagefindLoadPromise;
}

const MAX_LIST_PAGE_SIZE = 50;
const MAX_SEARCH_RESULTS = 10;

// ---------------------------------------------------------------------------
// 文章元信息数据层（/api/posts.json）
// ---------------------------------------------------------------------------

interface PostMeta {
    title: string;
    abbrlink: string;
    date?: string;
    updated?: string;
    tags?: string[];
    categories?: string[];
    desc?: string;
    wordCount?: number;
    url: string;
}

let postsMetaPromise: Promise<PostMeta[] | null> | null = null;

/** 加载文章元信息索引（惰性 + 缓存） */
function loadPostsMeta(): Promise<PostMeta[] | null> {
    if (!postsMetaPromise) {
        postsMetaPromise = fetchJSON("/api/posts.json").then((data) =>
            Array.isArray(data) ? (data as PostMeta[]) : null,
        );
    }
    return postsMetaPromise;
}

/** 按 abbrlink 精确查找 */
function findById(list: PostMeta[], id: string): PostMeta | undefined {
    return list.find((p) => p.abbrlink === id);
}

/** 按标题/标签关键词模糊查找（取第一条） */
function findByKeyword(list: PostMeta[], keyword: string): PostMeta | undefined {
    const kw = keyword.toLowerCase();
    return (
        list.find((p) => p.title.toLowerCase().includes(kw)) ??
        list.find((p) => (p.tags ?? []).some((t) => t.toLowerCase().includes(kw)))
    );
}

/** 简化为输出用的元信息视图 */
function briefMeta(p: PostMeta): Record<string, unknown> {
    return {
        title: p.title,
        abbrlink: p.abbrlink,
        date: p.date ?? undefined,
        tags: p.tags ?? [],
        categories: p.categories ?? [],
        desc: p.desc ?? undefined,
        wordCount: p.wordCount ?? undefined,
        url: p.url,
    };
}

/** 从当前 URL 解析 abbrlink（/posts/{abbrlink}/ 或 /posts/{abbrlink}.md） */
function currentAbbrlinkFromPath(): string | null {
    const m = location.pathname.match(/^\/posts\/([^/]+?)(?:\.md)?\/?$/);
    return m ? decodeURIComponent(m[1]) : null;
}

// ---------------------------------------------------------------------------
// 工具定义（描述中英双语，随站点语言切换）
// ---------------------------------------------------------------------------

function listPostsTool(): WebMCPTool {
    return {
        name: "stalux_list_posts",
        title: pick("列出博客文章", "List blog posts"),
        description: pick(
            "分页列出博客的全部已发布文章，返回标题、永久链接（abbrlink）、日期、分类、标签、摘要与文章页 URL。" +
                "需要浏览全站文章、确认某篇文章的 abbrlink 时使用；不返回正文，" +
                "只要某篇元信息用 stalux_get_post，读正文请用 stalux_read_post。",
            "Paginated list of all published posts, returning title, permanent link (abbrlink), date, categories, tags, description and post page URL. " +
                "Use it to browse the whole blog or find a post's abbrlink; it does not return body content — " +
                "use stalux_get_post for one post's metadata, or stalux_read_post for the full body.",
        ),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: {
            type: "object",
            properties: {
                page: {
                    type: "integer",
                    minimum: 1,
                    default: 1,
                    description: pick("页码，从 1 开始", "Page number, starting at 1"),
                },
                pageSize: {
                    type: "integer",
                    minimum: 1,
                    maximum: MAX_LIST_PAGE_SIZE,
                    default: 10,
                    description: pick(
                        "每页条数，最大 " + MAX_LIST_PAGE_SIZE,
                        "Items per page, max " + MAX_LIST_PAGE_SIZE,
                    ),
                },
            },
            additionalProperties: false,
        },
        execute: async (input) => {
            const page = Math.max(1, Number(input.page) || 1);
            const pageSize = Math.min(
                MAX_LIST_PAGE_SIZE,
                Math.max(1, Number(input.pageSize) || 10),
            );
            const list = await loadPostsMeta();
            if (!list)
                return err(
                    "INDEX_UNAVAILABLE",
                    pick("无法获取文章列表", "Unable to fetch post list"),
                );
            const total = list.length;
            const totalPages = Math.ceil(total / pageSize) || 1;
            const start = (page - 1) * pageSize;
            if (start >= total) {
                return err(
                    "OUT_OF_RANGE",
                    pick(
                        "第 " + page + " 页没有文章（共 " + totalPages + " 页）",
                        "Page " + page + " has no posts (" + totalPages + " pages total)",
                    ),
                    {
                        page,
                        totalPages,
                        total,
                    },
                );
            }
            const posts = list.slice(start, start + pageSize).map(briefMeta);
            return { ok: true, page, pageSize, total, totalPages, posts };
        },
    };
}

function getPostTool(): WebMCPTool {
    return {
        name: "stalux_get_post",
        title: pick("查看文章信息", "Get post info"),
        description: pick(
            "按 abbrlink 或标题关键词定位一篇文章，返回其元信息（标题、日期、分类、标签、摘要、字数、文章页 URL）。" +
                "只要元信息时用它，比读取正文便宜得多；读正文请用 stalux_read_post。" +
                "获取 abbrlink 可先用 stalux_list_posts 或 stalux_search_posts。",
            "Locate a post by abbrlink or title keyword and return its metadata (title, date, categories, tags, description, word count, post page URL). " +
                "Use it when only metadata is needed — cheaper than reading the full body; use stalux_read_post for the body. " +
                "To get an abbrlink, first use stalux_list_posts or stalux_search_posts.",
        ),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: pick(
                        "文章 abbrlink（如 f4442947）或标题关键词（模糊匹配，取第一条命中）",
                        "Post abbrlink (e.g. f4442947) or a title keyword (fuzzy match, first hit wins)",
                    ),
                },
            },
            required: ["id"],
            additionalProperties: false,
        },
        execute: async (input) => {
            const id = String(input.id ?? "").trim();
            if (!id) {
                return err(
                    "BAD_INPUT",
                    pick(
                        "请提供文章 abbrlink 或标题关键词",
                        "Provide a post abbrlink or title keyword",
                    ),
                );
            }
            const list = await loadPostsMeta();
            if (!list)
                return err(
                    "INDEX_UNAVAILABLE",
                    pick("无法获取文章索引", "Unable to fetch post index"),
                );
            const post = findById(list, id) ?? findByKeyword(list, id);
            if (!post) return err("NOT_FOUND", pick("未找到文章: ", "Post not found: ") + id);
            return { ok: true, post: briefMeta(post) };
        },
    };
}

function currentPostTool(): WebMCPTool {
    return {
        name: "stalux_current_post",
        title: pick("当前文章信息", "Current post info"),
        description: pick(
            "返回用户当前正在浏览的那篇文章的元信息。当用户说「这篇文章」「当前页面」时先调用它确定上下文，" +
                "比读正文便宜得多。不在文章页时返回错误。",
            "Return the metadata of the post the user is currently viewing. " +
                "Call it first when the user says 'this post' or 'the current page' to establish context — cheaper than reading the body. " +
                "Returns an error when not on a post page.",
        ),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        execute: async () => {
            const id = currentAbbrlinkFromPath();
            if (!id) {
                return err(
                    "NOT_ON_POST_PAGE",
                    pick("当前不在文章页（路径: ", "Not on a post page (path: ") +
                        location.pathname +
                        ")",
                );
            }
            const list = await loadPostsMeta();
            if (!list)
                return err(
                    "INDEX_UNAVAILABLE",
                    pick("无法获取文章索引", "Unable to fetch post index"),
                );
            const post = findById(list, id);
            if (!post)
                return err("NOT_FOUND", pick("未找到当前文章: ", "Current post not found: ") + id);
            return { ok: true, post: briefMeta(post) };
        },
    };
}

function randomPostTool(): WebMCPTool {
    return {
        name: "stalux_random_post",
        title: pick("随机一篇文章", "Random post"),
        description: pick(
            "随机挑选一篇文章并返回其元信息（标题、abbrlink、日期、摘要、URL）。" +
                "适合推荐、探索、或不确定从哪篇开始时使用；不返回正文，不导航。",
            "Pick a random post and return its metadata (title, abbrlink, date, description, URL). " +
                "Useful for recommendations, discovery, or when unsure where to start; it does not return body content and does not navigate.",
        ),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        execute: async () => {
            const list = await loadPostsMeta();
            if (!list || list.length === 0) {
                return err(
                    "INDEX_UNAVAILABLE",
                    pick("无法获取文章索引", "Unable to fetch post index"),
                );
            }
            const post = list[Math.floor(Math.random() * list.length)];
            return { ok: true, post: briefMeta(post) };
        },
    };
}

function searchPostsTool(): WebMCPTool {
    return {
        name: "stalux_search_posts",
        title: pick("搜索博客文章", "Search blog posts"),
        description: pick(
            "用关键词搜索博客文章的标题、标签、分类与正文全文，返回命中文章的标题、链接与摘要片段。" +
                "适合「博客里写过 X 吗」「帮我找一下关于 Y 的文章」这类问题；" +
                "定位到具体文章后再用 stalux_read_post 读正文、stalux_get_post 取元信息。",
            "Search the full text of all posts (title, tags, categories, body) by keyword, returning matching posts with title, URL and excerpt snippets. " +
                "Ideal for questions like 'has the blog covered X?' or 'find posts about Y'; " +
                "once a post is located, use stalux_read_post for the body or stalux_get_post for metadata.",
        ),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: {
            type: "object",
            properties: {
                keyword: {
                    type: "string",
                    description: pick("搜索关键词", "Search keyword"),
                },
                limit: {
                    type: "integer",
                    minimum: 1,
                    maximum: MAX_SEARCH_RESULTS,
                    default: 10,
                    description: pick("最多返回条数", "Maximum number of results to return"),
                },
            },
            required: ["keyword"],
            additionalProperties: false,
        },
        execute: async (input) => {
            const keyword = String(input.keyword ?? "").trim();
            if (!keyword)
                return err("BAD_INPUT", pick("请提供搜索关键词", "Provide a search keyword"));
            const limit = Math.min(MAX_SEARCH_RESULTS, Math.max(1, Number(input.limit) || 10));
            const pagefind = await loadPagefind();
            if (!pagefind) {
                return err(
                    "INDEX_UNAVAILABLE",
                    pick("全文搜索索引不可用", "Full-text search index unavailable"),
                );
            }
            const res = (await pagefind.search(keyword)) as {
                results?: Array<{ data: () => Promise<unknown> }>;
            };
            if (!res || !Array.isArray(res.results)) {
                return err(
                    "SEARCH_FAILED",
                    pick("搜索失败，请重试", "Search failed, please retry"),
                );
            }
            const items = await Promise.all(
                res.results.slice(0, limit).map(async (r) => {
                    try {
                        const data = (await r.data()) as {
                            url?: string;
                            title?: string;
                            excerpt?: string;
                        };
                        return {
                            url: data?.url ?? "",
                            title: data?.title ?? "",
                            excerpt: (data?.excerpt ?? "").slice(0, 240),
                        };
                    } catch {
                        return null;
                    }
                }),
            );
            const posts = items.filter((x): x is NonNullable<typeof x> => x !== null);
            return { ok: true, keyword, count: posts.length, posts };
        },
    };
}

function readPostTool(): WebMCPTool {
    return {
        name: "stalux_read_post",
        title: pick("读取文章 Markdown", "Read post Markdown"),
        description: pick(
            "按 abbrlink（文章永久链接 ID）读取一篇博客文章的原始 Markdown 全文，包含 frontmatter 与版权脚注。" +
                "需要文章完整内容、引用或摘要时使用；只要元信息用 stalux_get_post（更便宜）。" +
                "获取 abbrlink 可先用 stalux_list_posts 或 stalux_search_posts。",
            "Read the full raw Markdown of a post by abbrlink (permanent link ID), including frontmatter and copyright footer. " +
                "Use it for full content, quotes or summarization; for metadata only, stalux_get_post is cheaper. " +
                "To get an abbrlink, first use stalux_list_posts or stalux_search_posts.",
        ),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: pick(
                        "文章的 abbrlink，如 f4442947",
                        "Post abbrlink, e.g. f4442947",
                    ),
                },
            },
            required: ["id"],
            additionalProperties: false,
        },
        execute: async (input) => {
            const id = String(input.id ?? "").trim();
            if (!id)
                return err("BAD_INPUT", pick("请提供文章 abbrlink", "Provide a post abbrlink"));
            const url = "/posts/" + encodeURIComponent(id) + ".md";
            const r = await fetch(url, { headers: { Accept: "text/markdown" } });
            if (r.status === 404)
                return err("NOT_FOUND", pick("未找到文章: ", "Post not found: ") + id);
            if (!r.ok) {
                return err(
                    "FETCH_FAILED",
                    pick("无法获取文章 Markdown：", "Failed to fetch post Markdown: ") + url,
                );
            }
            const markdown = await r.text();
            return { ok: true, url, markdown: markdown.slice(0, 50000) };
        },
    };
}

function siteInfoTool(): WebMCPTool {
    return {
        name: "stalux_site_info",
        title: pick("站点信息", "Site info"),
        description: pick(
            "返回博客的站点信息（标题、简介、站点 URL），并给出更完整的机器可读内容入口：" +
                "/llms.txt（站点导航与文章链接列表）与 /llms-full.txt（全站 Markdown 镜像，含全部文章正文）。" +
                "适合需要了解博客主题、定位内容、或批量获取全站数据时使用。",
            "Return the blog's site info (title, description, site URL) plus pointers to machine-readable content: " +
                "/llms.txt (site navigation and post link list) and /llms-full.txt (full-site Markdown mirror with all post bodies). " +
                "Use it to understand the blog's topic, orient, or bulk-fetch all content.",
        ),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        execute: async () => {
            const info = window.__STALUX_SITE_INFO__ ?? {};
            return {
                ok: true,
                title: info.title ?? "",
                url: info.url ?? "",
                description: info.description ?? "",
                lang: info.lang ?? "",
                llms: (info.url ?? "") + "/llms.txt",
                llmsFull: (info.url ?? "") + "/llms-full.txt",
            };
        },
    };
}

function buildTools(): WebMCPTool[] {
    return [
        listPostsTool(),
        getPostTool(),
        currentPostTool(),
        randomPostTool(),
        searchPostsTool(),
        readPostTool(),
        siteInfoTool(),
    ];
}

// ---------------------------------------------------------------------------
// 注册逻辑
// ---------------------------------------------------------------------------

/** 当前注册批次使用的 AbortController，软导航时先 abort 注销再重注册 */
let activeController: AbortController | null = null;

async function registerTools(): Promise<{ registered: string[]; reason?: string }> {
    const doc = document as DocumentWithModelContext;
    const ctx = doc.modelContext;
    if (!ctx || typeof ctx.registerTool !== "function") {
        return { registered: [], reason: "unsupported" };
    }

    // 注销上一轮注册（View Transitions 软导航后 modelContext 可能已重置）
    if (activeController) {
        try {
            activeController.abort();
        } catch {
            /* 忽略注销异常 */
        }
    }
    const controller = new AbortController();
    activeController = controller;

    const tools = buildTools();
    const registered: string[] = [];
    // 逐个注册：单个失败不中断其余工具
    for (const tool of tools) {
        try {
            await ctx.registerTool(tool, { signal: controller.signal });
            registered.push(tool.name);
        } catch (e) {
            console.warn("[stalux/webmcp] 注册失败: " + tool.name, e);
        }
    }
    return { registered };
}

// ---------------------------------------------------------------------------
// 挂载与自动注册
// ---------------------------------------------------------------------------

if (typeof document !== "undefined") {
    // 首屏加载 + View Transitions 软导航都执行（soft navigation 时页面状态会重建）
    document.addEventListener("astro:page-load", () => {
        void registerTools().then((r) => {
            if (r.reason === "unsupported") return; // 无 WebMCP 环境，静默跳过
            if (r.registered.length) {
                console.info(
                    "[stalux/webmcp] 已注册 " +
                        r.registered.length +
                        " 个工具: " +
                        r.registered.join(", "),
                );
            }
        });
    });
}

export {};
