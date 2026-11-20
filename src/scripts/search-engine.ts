import { load, type RawData } from "@orama/orama";
import { escape as escapeHtml } from "html-escaper";
import { createSearchIndex, normalizeSearch, searchDocuments } from "../utils/orama-search";
import { sitePath } from "../utils/site-path";

export interface SearchData {
    url: string;
    meta?: Record<string, string>;
    content?: string;
    excerpt?: string;
    plain_excerpt?: string;
    filters?: Record<string, string[]>;
}
export interface SearchResult {
    id: string;
    data: () => Promise<SearchData>;
}
export interface SearchResponse {
    results: SearchResult[];
    filters?: Record<string, Record<string, number>>;
    totalFilters?: Record<string, Record<string, number>>;
    unfilteredTotalCount?: number;
}
export interface SearchOptions {
    filters?: Record<string, string | string[]>;
    sort?: Record<string, "asc" | "desc">;
}
export async function loadOramaSearch(base: string, request: typeof fetch = fetch) {
    const response = await request(sitePath("orama/index.bin", base));
    if (!(response.ok && response.body)) throw new Error(`Orama index HTTP ${response.status}`);
    const inflated = response.body.pipeThrough(new DecompressionStream("gzip"));
    const artifact = (await new Response(inflated).json()) as {
        cjk: boolean;
        count: number;
        data: RawData;
    };
    const database = createSearchIndex(artifact.cjk);
    load(database, artifact.data);
    return { ...artifact, database };
}

export function createOramaSearch(
    base: string,
    request: typeof fetch = fetch,
    language = () => document.documentElement.lang.toLowerCase(),
) {
    let pending: ReturnType<typeof loadOramaSearch> | undefined;
    async function index() {
        pending ??= loadOramaSearch(base, request).catch((error: unknown) => {
            pending = undefined;
            throw error;
        });
        return pending;
    }
    return {
        ready: index,
        async search(query: string | null, options?: SearchOptions): Promise<SearchResponse> {
            const postFilter = options?.filters?.post;
            const post = typeof postFilter === "string" ? postFilter : postFilter?.[0];
            if (!(query?.trim() || post)) return { results: [] };
            const { cjk, count, database } = await index();
            const results = await searchDocuments(database, query ?? "", {
                cjk,
                language: language(),
                limit: count,
                ...(post ? { post } : {}),
            });
            return {
                results: results.map(({ id, document: record }) => ({
                    id,
                    data: async () => {
                        const needle =
                            normalizeSearch(query ?? "")
                                .replace(/^"(.+)"$/u, "$1")
                                .split(/\s+/u)[0] ?? "";
                        const position = Math.max(
                            0,
                            normalizeSearch(record.content).indexOf(needle),
                        );
                        const start = Math.max(0, position - 60);
                        const snippet = record.content.slice(start, start + 180);
                        const plain = `${start ? "…" : ""}${snippet}${start + snippet.length < record.content.length ? "…" : ""}`;
                        return {
                            url: String(record.url),
                            meta: { title: record.title },
                            content: record.content,
                            excerpt: escapeHtml(plain),
                            plain_excerpt: plain,
                            filters: record.post ? { post: [String(record.post)] } : {},
                        };
                    },
                })),
                unfilteredTotalCount: results.length,
            };
        },
        async options() {},
        async filters(): Promise<Record<string, Record<string, number>>> {
            return {};
        },
    };
}
