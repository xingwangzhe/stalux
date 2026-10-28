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
// ESM entry exports an initializer; importing it alone does not install the API.
import { initializeWebMCPPolyfill } from "@mcp-b/webmcp-polyfill";
import { createPostLookup } from "../utils/post-lookup";
import { sitePath } from "../utils/site-path";
import { createClientLogger } from "./logger";
import { registerPageLifecycle } from "./page-runtime";
import { loadPagefind } from "./pagefind-api";

const logger = createClientLogger("webmcp");

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
    execute: (
        input: Record<string, unknown>,
        options?: { signal?: AbortSignal },
    ) => Promise<unknown>;
}

interface ModelContext {
    registerTool: (tool: WebMCPTool, options?: { signal?: AbortSignal }) => Promise<undefined>;
}

type DocumentWithModelContext = { modelContext?: ModelContext };

// ---------------------------------------------------------------------------
// 语言选择（跟随站点 site.yml 的 lang）
// ---------------------------------------------------------------------------

const SITE_LANG =
    (typeof document === "undefined"
        ? "zh-CN"
        : document.body?.dataset.staluxSiteLang
    )?.toLowerCase() ?? "zh-cn";

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
    logger.debug(`tool result error=${code}`);
    return { ok: false, code, message, ...extra };
}

async function fetchJSON(url: string): Promise<unknown> {
    const r = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
        logger.debug(`JSON request failed; status=${r.status}`);
        return null;
    }
    return r.json();
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
const postLookups = new WeakMap<PostMeta[], ReturnType<typeof createPostLookup<PostMeta>>>();

function lookupFor(list: PostMeta[]) {
    let lookup = postLookups.get(list);
    if (!lookup) {
        lookup = createPostLookup(list);
        postLookups.set(list, lookup);
    }
    return lookup;
}

/** 加载文章元信息索引（惰性 + 缓存） */
function loadPostsMeta(): Promise<PostMeta[] | null> {
    if (!postsMetaPromise) {
        const attempt = fetchJSON(sitePath("api/posts.json"))
            .then((data) => {
                if (
                    !(
                        Array.isArray(data) &&
                        data.every(
                            (post) =>
                                post &&
                                typeof post.title === "string" &&
                                typeof post.abbrlink === "string" &&
                                typeof post.url === "string" &&
                                (post.desc === undefined || typeof post.desc === "string") &&
                                (!post.categories ||
                                    (Array.isArray(post.categories) &&
                                        post.categories.every(
                                            (category: unknown) => typeof category === "string",
                                        ))) &&
                                (!post.tags ||
                                    (Array.isArray(post.tags) &&
                                        post.tags.every(
                                            (tag: unknown) => typeof tag === "string",
                                        ))),
                        )
                    )
                )
                    return null;
                return data as PostMeta[];
            })
            .catch(() => null);
        postsMetaPromise = attempt;
        void attempt.then((result) => {
            if (!result && postsMetaPromise === attempt) postsMetaPromise = null;
        });
    }
    return postsMetaPromise;
}

/** 按 abbrlink 精确查找 */
function findById(list: PostMeta[], id: string): PostMeta | undefined {
    return lookupFor(list).findById(id);
}

/** 按标题/标签关键词模糊查找（取第一条） */
function findByKeyword(list: PostMeta[], keyword: string): PostMeta | undefined {
    return lookupFor(list).findByKeyword(keyword);
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
        url: new URL(p.url, location.origin).href,
    };
}

/** 从当前 URL 解析 abbrlink（/posts/{abbrlink}/ 或 /posts/{abbrlink}.md） */
function currentAbbrlinkFromPath(): string | null {
    return postIdFromUrl(location.href);
}

function postIdFromUrl(value: string): string | null {
    try {
        const url = new URL(value, location.origin);
        if (url.origin !== location.origin) return null;
        const prefix = sitePath("posts/");
        if (!url.pathname.startsWith(prefix)) return null;
        const suffix = url.pathname.slice(prefix.length);
        const path = suffix.endsWith("/") ? suffix.slice(0, -1) : suffix.replace(/\.md$/, "");
        if (!path || path.includes("/")) return null;
        return decodeURIComponent(path);
    } catch {
        return null;
    }
}

function integerInput(
    value: unknown,
    fallback: number,
    minimum: number,
    maximum = Number.MAX_SAFE_INTEGER,
): number | undefined {
    if (value === undefined) return fallback;
    return typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= minimum &&
        value <= maximum
        ? value
        : undefined;
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
                "只要某篇元信息用 stalux_get_post，读正文请用 stalux_read_post。" +
                "pageSize 可设 50 减少翻页，按 totalPages 继续分页；页码越界时会自动返回最后一页（clamped 标记）。",
            "Paginated list of all published posts, returning title, permanent link (abbrlink), date, categories, tags, description and post page URL. " +
                "Use it to browse the whole blog or find a post's abbrlink; it does not return body content — " +
                "use stalux_get_post for one post's metadata, or stalux_read_post for the full body. " +
                "Use pageSize 50 to reduce calls and follow totalPages to continue; out-of-range pages clamp to the last page (clamped flag).",
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
                        `每页条数，最大 ${MAX_LIST_PAGE_SIZE}`,
                        `Items per page, max ${MAX_LIST_PAGE_SIZE}`,
                    ),
                },
            },
            additionalProperties: false,
        },
        execute: async (input) => {
            const page = integerInput(input.page, 1, 1);
            const pageSize = integerInput(input.pageSize, 10, 1, MAX_LIST_PAGE_SIZE);
            if (page === undefined || pageSize === undefined)
                return err(
                    "BAD_INPUT",
                    pick(
                        "页码和每页条数必须是有效整数",
                        "Page and pageSize must be valid integers",
                    ),
                );
            const list = await loadPostsMeta();
            if (!list)
                return err(
                    "INDEX_UNAVAILABLE",
                    pick("无法获取文章列表", "Unable to fetch post list"),
                );
            const total = list.length;
            const totalPages = Math.ceil(total / pageSize) || 1;
            // 越界时自动回退到最后一页（而非报错），agent 翻过头也能拿到数据
            let clamped = false;
            let resolvedPage = page;
            if (page > totalPages) {
                resolvedPage = totalPages;
                clamped = true;
            }
            const start = (resolvedPage - 1) * pageSize;
            const posts = list.slice(start, start + pageSize).map(briefMeta);
            return { ok: true, page: resolvedPage, pageSize, total, totalPages, clamped, posts };
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
            const id = typeof input.id === "string" ? input.id.trim() : "";
            if (!id || id.length > 512) {
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
            if (!post) return err("INDEX_EMPTY", pick("文章索引为空", "Post index is empty"));
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
                "全文索引不可用时仅返回元信息匹配，并标记 fullText: false；不把索引故障当成全文无匹配。" +
                "适合「博客里写过 X 吗」「帮我找一下关于 Y 的文章」这类问题；" +
                "定位到具体文章后再用 stalux_read_post 读正文、stalux_get_post 取元信息。",
            "Search the full text of all posts (title, tags, categories, body) by keyword, returning matching posts with title, URL and excerpt snippets. " +
                "If Pagefind is unavailable, metadata-only matches are marked fullText: false; index failures are not treated as an empty full-text result. " +
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
        execute: async (input, options) => {
            const keyword = typeof input.keyword === "string" ? input.keyword.trim() : "";
            const limit = integerInput(input.limit, 10, 1, MAX_SEARCH_RESULTS);
            if (!keyword || keyword.length > 256 || limit === undefined)
                return err("BAD_INPUT", pick("搜索参数无效", "Invalid search parameters"));
            const list = await loadPostsMeta();
            if (!list)
                return err("INDEX_UNAVAILABLE", pick("文章索引不可用", "Post index unavailable"));
            const metadataMatches = lookupFor(list)
                .findMatches(keyword, limit)
                .map((post) => ({
                    abbrlink: post.abbrlink,
                    title: post.title,
                    url: new URL(post.url, location.origin).href,
                    excerpt: (post.desc ?? "").slice(0, 240),
                }));
            const fallback = (code: string) =>
                metadataMatches.length
                    ? {
                          ok: true,
                          keyword,
                          count: metadataMatches.length,
                          posts: metadataMatches,
                          source: "metadata",
                          fullText: false,
                          notice: pick(
                              "全文索引不可用，仅返回标题、标签、分类和摘要匹配",
                              "Full-text index unavailable; returning title, tag, category and description matches only",
                          ),
                      }
                    : err(
                          code,
                          pick(
                              "全文索引不可用，且元信息没有匹配项",
                              "Full-text index unavailable and no metadata matches",
                          ),
                      );
            const pagefind = await loadPagefind();
            options?.signal?.throwIfAborted();
            if (!pagefind) return fallback("INDEX_UNAVAILABLE");
            try {
                const result = await pagefind.search(keyword);
                if (!(result && Array.isArray(result.results))) return fallback("SEARCH_FAILED");
                const posts: Record<string, unknown>[] = [...metadataMatches];
                const seen = new Set(metadataMatches.map((post) => post.abbrlink));
                for (
                    let offset = 0;
                    offset < result.results.length && posts.length < limit;
                    offset += MAX_SEARCH_RESULTS
                ) {
                    options?.signal?.throwIfAborted();
                    const batch = await Promise.all(
                        result.results
                            .slice(offset, offset + MAX_SEARCH_RESULTS)
                            .map(async (entry) => {
                                try {
                                    return await entry.data();
                                } catch {
                                    return null;
                                }
                            }),
                    );
                    for (const data of batch) {
                        if (!data) continue;
                        const id = postIdFromUrl(data.url);
                        const post = id ? findById(list, id) : undefined;
                        if (!post || seen.has(post.abbrlink)) continue;
                        seen.add(post.abbrlink);
                        posts.push({
                            abbrlink: post.abbrlink,
                            url: new URL(data.url, location.origin).href,
                            title:
                                typeof data.meta?.title === "string" && data.meta.title
                                    ? data.meta.title
                                    : post.title,
                            excerpt: (data.plain_excerpt ?? post.desc ?? "").slice(0, 240),
                        });
                        if (posts.length >= limit) break;
                    }
                }
                return {
                    ok: true,
                    keyword,
                    count: posts.length,
                    posts,
                    source: "pagefind+metadata",
                    fullText: true,
                };
            } catch {
                if (options?.signal?.aborted) throw options.signal.reason;
                return fallback("SEARCH_FAILED");
            }
        },
    };
}

function readPostTool(): WebMCPTool {
    return {
        name: "stalux_read_post",
        title: pick("读取文章内容", "Read post content"),
        description: pick(
            "按 abbrlink 读取文章。开启 Markdown 导出时返回规范化 Markdown，否则从 Pagefind 返回已索引纯文本（不含 Markdown 语法）。" +
                "format 标明格式；truncated 为 true 时用 nextOffset 续读，直到 nextOffset 为 null。只要元信息用 stalux_get_post（更便宜）。" +
                "获取 abbrlink 可先用 stalux_list_posts 或 stalux_search_posts。",
            "Read a post by abbrlink: normalized Markdown when exports are enabled, otherwise indexed plain text from Pagefind without Markdown syntax. " +
                "Check format; when truncated, continue with nextOffset until null. For metadata only, stalux_get_post is cheaper. " +
                "To get an abbrlink, first use stalux_list_posts or stalux_search_posts.",
        ),
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: {
            type: "object",
            properties: {
                offset: {
                    type: "integer",
                    minimum: 0,
                    default: 0,
                    description: "UTF-16 content offset; continue with nextOffset",
                },
                maxChars: {
                    type: "integer",
                    minimum: 1,
                    maximum: 50000,
                    default: 50000,
                    description: "Maximum UTF-16 units returned; a surrogate pair is never split",
                },
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
        execute: async (input, options) => {
            const id = typeof input.id === "string" ? input.id.trim() : "";
            const offset = integerInput(input.offset, 0, 0);
            const maxChars = integerInput(input.maxChars, 50000, 1, 50000);
            if (!id || id.length > 512 || offset === undefined || maxChars === undefined)
                return err(
                    "BAD_INPUT",
                    pick(
                        "请提供有效的文章 ID 和读取范围",
                        "Provide a valid post ID and content range",
                    ),
                );
            const list = await loadPostsMeta();
            if (!list)
                return err("INDEX_UNAVAILABLE", pick("文章索引不可用", "Post index unavailable"));
            const post = findById(list, id);
            if (!post) return err("NOT_FOUND", pick("未找到文章: ", "Post not found: ") + id);
            const url = new URL(sitePath(`posts/${encodeURIComponent(id)}.md`), location.origin)
                .href;
            let content: string | undefined;
            let format = "text/markdown";
            let source = url;
            if (document.body?.dataset.staluxMarkdownExport !== "false") {
                try {
                    const signal = options?.signal
                        ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
                        : AbortSignal.timeout(15000);
                    const response = await fetch(url, {
                        headers: { Accept: "text/markdown" },
                        signal,
                    });
                    if (response.ok && !response.headers.get("Content-Type")?.includes("text/html"))
                        content = await response.text();
                } catch {
                    if (options?.signal?.aborted) throw options.signal.reason;
                }
            }
            if (content === undefined) {
                const pagefind = await loadPagefind();
                if (!pagefind)
                    return err(
                        "CONTENT_UNAVAILABLE",
                        pick(
                            "Markdown 和静态搜索正文均不可用",
                            "Neither Markdown nor indexed content is available",
                        ),
                    );
                try {
                    const result = await pagefind.search(null, { filters: { post: id } });
                    for (const entry of result.results) {
                        const data = await entry.data();
                        if (postIdFromUrl(data.url) === id && typeof data.content === "string") {
                            content = data.content;
                            format = "text/plain";
                            source = new URL(data.url, location.origin).href;
                            break;
                        }
                    }
                } catch {
                    return err(
                        "CONTENT_UNAVAILABLE",
                        pick(
                            "读取静态搜索正文失败，请重试",
                            "Unable to read indexed content; retry",
                        ),
                    );
                }
            }
            if (content === undefined)
                return err(
                    "CONTENT_UNAVAILABLE",
                    pick(
                        "该文章没有可读取的静态正文",
                        "No static content is available for this post",
                    ),
                );
            if (
                offset > content.length ||
                (offset > 0 &&
                    /[\uDC00-\uDFFF]/u.test(content.charAt(offset)) &&
                    /[\uD800-\uDBFF]/u.test(content.charAt(offset - 1)))
            )
                return err(
                    "BAD_INPUT",
                    pick(
                        "读取偏移超出正文范围或切开 Unicode 字符",
                        "Offset is outside the content or splits a Unicode character",
                    ),
                );
            let end = Math.min(content.length, offset + maxChars);
            if (
                end < content.length &&
                /[\uD800-\uDBFF]/u.test(content.charAt(end - 1)) &&
                /[\uDC00-\uDFFF]/u.test(content.charAt(end))
            )
                end--;
            if (end === offset && end < content.length)
                return err(
                    "BAD_INPUT",
                    pick(
                        "maxChars 太小，无法容纳当前 Unicode 字符",
                        "maxChars is too small for this Unicode character",
                    ),
                );
            const chunk = content.slice(offset, end);
            return {
                ok: true,
                abbrlink: id,
                url: source,
                format,
                ...(format === "text/markdown" ? { markdown: chunk } : { content: chunk }),
                offset,
                totalChars: content.length,
                truncated: end < content.length,
                nextOffset: end < content.length ? end : null,
            };
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
            const body = document.body;
            const info = window.__STALUX_SITE_INFO__ ?? {
                title: body?.dataset.staluxSiteTitle,
                url: body?.dataset.staluxSiteUrl,
                description: body?.dataset.staluxSiteDescription,
                lang: body?.dataset.staluxSiteLang,
            };
            return {
                ok: true,
                title: info.title ?? "",
                url: info.url ?? "",
                description: info.description ?? "",
                lang: info.lang ?? "",
                llms: new URL(sitePath("llms.txt"), location.origin).href,
                llmsFull: new URL(sitePath("llms-full.txt"), location.origin).href,
                markdownExport: document.body?.dataset.staluxMarkdownExport === "true",
                transport: "WebMCP",
            };
        },
    };
}

function buildTools(): WebMCPTool[] {
    const tools: WebMCPTool[] = [
        listPostsTool(),
        getPostTool(),
        currentPostTool(),
        randomPostTool(),
        searchPostsTool(),
        readPostTool(),
        siteInfoTool(),
    ];
    return tools.map((tool) => {
        const execute = tool.execute;
        return {
            ...tool,
            execute: async (input: Record<string, unknown>, options?: { signal?: AbortSignal }) => {
                if (!input || typeof input !== "object" || Array.isArray(input))
                    return err("BAD_INPUT", pick("参数必须是对象", "Input must be an object"));
                const properties =
                    (tool.inputSchema as { properties?: Record<string, unknown> })?.properties ??
                    {};
                if (Object.keys(input).some((key) => !Object.hasOwn(properties, key)))
                    return err("BAD_INPUT", pick("包含未知参数", "Unknown input property"));
                if (options?.signal?.aborted) throw options.signal.reason;
                try {
                    const result = await execute(input, options);
                    options?.signal?.throwIfAborted();
                    return result;
                } catch (error) {
                    if (options?.signal?.aborted) throw options.signal.reason;
                    logger.error("tool execution failed", error);
                    return err(
                        "FETCH_FAILED",
                        pick(
                            "读取静态博客资源失败，请重试",
                            "Unable to read static blog resources; retry",
                        ),
                    );
                }
            },
        };
    });
}

// ---------------------------------------------------------------------------
// 注册逻辑
// ---------------------------------------------------------------------------

async function registerTools(
    signal: AbortSignal,
): Promise<{ registered: string[]; reason?: string }> {
    const doc = document as DocumentWithModelContext;
    const ctx = doc.modelContext;
    if (!ctx || typeof ctx.registerTool !== "function") {
        logger.debug("modelContext unavailable; registration skipped");
        return { registered: [], reason: "unsupported" };
    }

    const tools = buildTools();
    const registered: string[] = [];
    // 逐个注册：单个失败不中断其余工具
    for (const tool of tools) {
        if (signal.aborted) break;
        try {
            await ctx.registerTool(
                {
                    ...tool,
                    execute: (input, executionOptions) =>
                        tool.execute(input, {
                            signal: executionOptions?.signal
                                ? AbortSignal.any([signal, executionOptions.signal])
                                : signal,
                        }),
                },
                { signal },
            );
            if (signal.aborted) break;
            registered.push(tool.name);
        } catch (e) {
            if (signal.aborted) break;
            logger.error(`tool registration failed: ${tool.name}`, e);
        }
    }
    return { registered };
}

// ---------------------------------------------------------------------------
// 挂载与自动注册
// ---------------------------------------------------------------------------

registerPageLifecycle("webmcp", () => {
    // Astro can hoist processed scripts from conditional template branches.
    if (document.body?.dataset.staluxWebmcpEnabled === "false") return;
    initializeWebMCPPolyfill();
    const controller = new AbortController();
    void registerTools(controller.signal)
        .then((r) => {
            if (controller.signal.aborted || r.reason === "unsupported") return;
            if (r.registered.length) {
                logger.debug(`已注册 ${r.registered.length} 个工具: ${r.registered.join(", ")}`);
            }
        })
        .catch((error: unknown) => {
            if (!controller.signal.aborted) logger.error("registration batch failed", error);
        });
    // Abort also unregisters tools already installed by this page's batch.
    return () => controller.abort();
});
