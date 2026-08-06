/**
 * Stalux WebMCP 工具注册（纯前端，零后端）
 *
 * 遵循 W3C webmachinelearning/webmcp 草案：网页通过 document.modelContext
 * 向浏览器/代理注册工具。所有数据源均为构建期静态产物——
 * /api/post.abbrlink.json（文章索引）、/posts/{id}.md（源码导出）、
 * /llms.txt / /llms-full.txt（站点信息镜像）、/pagefind/（全文索引）。
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
// 工具定义
// ---------------------------------------------------------------------------

interface PostIndexEntry {
    title: string;
    abbrlink: string | number;
}

function listPostsTool(): WebMCPTool {
    return {
        name: "stalux_list_posts",
        title: "列出博客文章",
        description:
            "分页列出博客的全部已发布文章，返回标题、永久链接（abbrlink）、文章页 URL。" +
            "需要浏览全站文章、确认某篇文章的 abbrlink 时使用；不返回正文，" +
            "正文请用 stalux_read_post。",
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: {
            type: "object",
            properties: {
                page: { type: "integer", minimum: 1, default: 1, description: "页码，从 1 开始" },
                pageSize: {
                    type: "integer",
                    minimum: 1,
                    maximum: MAX_LIST_PAGE_SIZE,
                    default: 10,
                    description: "每页条数，最大 " + MAX_LIST_PAGE_SIZE,
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
            const index = (await fetchJSON("/api/post.abbrlink.json")) as PostIndexEntry[] | null;
            if (!Array.isArray(index)) return err("INDEX_UNAVAILABLE", "无法获取文章列表");
            const total = index.length;
            const totalPages = Math.ceil(total / pageSize) || 1;
            const start = (page - 1) * pageSize;
            if (start >= total) {
                return err(
                    "OUT_OF_RANGE",
                    "第 " + page + " 页没有文章（共 " + totalPages + " 页）",
                    {
                        page,
                        totalPages,
                        total,
                    },
                );
            }
            const posts = index.slice(start, start + pageSize).map((p) => ({
                title: p.title,
                abbrlink: String(p.abbrlink),
                url: "/posts/" + p.abbrlink + "/",
            }));
            return { ok: true, page, pageSize, total, totalPages, posts };
        },
    };
}

function searchPostsTool(): WebMCPTool {
    return {
        name: "stalux_search_posts",
        title: "搜索博客文章",
        description:
            "用关键词搜索博客文章的标题、标签、分类与正文全文，返回命中文章的标题、链接与摘要片段。" +
            "适合「博客里写过 X 吗」「帮我找一下关于 Y 的文章」这类问题。",
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: {
            type: "object",
            properties: {
                keyword: { type: "string", description: "搜索关键词" },
                limit: {
                    type: "integer",
                    minimum: 1,
                    maximum: MAX_SEARCH_RESULTS,
                    default: 10,
                    description: "最多返回条数",
                },
            },
            required: ["keyword"],
            additionalProperties: false,
        },
        execute: async (input) => {
            const keyword = String(input.keyword ?? "").trim();
            if (!keyword) return err("BAD_INPUT", "请提供搜索关键词");
            const limit = Math.min(MAX_SEARCH_RESULTS, Math.max(1, Number(input.limit) || 10));
            const pagefind = await loadPagefind();
            if (!pagefind) return err("INDEX_UNAVAILABLE", "全文搜索索引不可用");
            const res = (await pagefind.search(keyword)) as {
                results?: Array<{ data: () => Promise<unknown> }>;
            };
            if (!res || !Array.isArray(res.results)) {
                return err("SEARCH_FAILED", "搜索失败，请重试");
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
        title: "读取文章 Markdown",
        description:
            "按 abbrlink（文章永久链接 ID）读取一篇博客文章的原始 Markdown 全文，包含 frontmatter 与版权脚注。" +
            "需要文章完整内容、引用或摘要时使用；获取 abbrlink 可先用 stalux_list_posts 或 stalux_search_posts。",
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "文章的 abbrlink，如 f4442947" },
            },
            required: ["id"],
            additionalProperties: false,
        },
        execute: async (input) => {
            const id = String(input.id ?? "").trim();
            if (!id) return err("BAD_INPUT", "请提供文章 abbrlink");
            const url = "/posts/" + encodeURIComponent(id) + ".md";
            const r = await fetch(url, { headers: { Accept: "text/markdown" } });
            if (r.status === 404) return err("NOT_FOUND", "未找到文章: " + id);
            if (!r.ok) return err("FETCH_FAILED", "无法获取文章 Markdown：" + url);
            const markdown = await r.text();
            return { ok: true, url, markdown: markdown.slice(0, 50000) };
        },
    };
}

function siteInfoTool(): WebMCPTool {
    return {
        name: "stalux_site_info",
        title: "站点信息",
        description:
            "返回博客的站点信息（标题、简介、站点 URL），并给出更完整的机器可读内容入口：" +
            "/llms.txt（站点导航与文章链接列表）与 /llms-full.txt（全站 Markdown 镜像，含全部文章正文）。" +
            "适合需要了解博客主题、定位内容、或批量获取全站数据时使用。",
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        execute: async () => {
            const info = window.__STALUX_SITE_INFO__ ?? {};
            return {
                ok: true,
                title: info.title ?? "",
                url: info.url ?? "",
                description: info.description ?? "",
                llms: (info.url ?? "") + "/llms.txt",
                llmsFull: (info.url ?? "") + "/llms-full.txt",
            };
        },
    };
}

function buildTools(): WebMCPTool[] {
    return [listPostsTool(), searchPostsTool(), readPostTool(), siteInfoTool()];
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
