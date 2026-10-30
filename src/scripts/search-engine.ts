import {
    CJK,
    type CjkDocument,
    type CjkManifest,
    cjkGrams,
    gramShard,
    normalizeSearch,
} from "../utils/cjk-search";
import { sitePath } from "../utils/site-path";
import { createClientLogger } from "./logger";

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
}
export interface NativeSearch {
    search: (query: string | null, options?: SearchOptions) => Promise<SearchResponse>;
    options: (options: Record<string, unknown>) => Promise<void>;
    filters: () => Promise<Record<string, Record<string, number>>>;
    mergeIndex: (url: string, options?: Record<string, unknown>) => Promise<void>;
}
const logger = createClientLogger("search/cjk");
const escapeHtml = (text: string) =>
    text.replace(
        /[&<>"']/gu,
        (char) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
    );

function excerpt(content: string, terms: string[]) {
    const position = Math.max(0, normalizeSearch(content).indexOf(terms[0] ?? ""));
    const start = Math.max(0, position - 45);
    const plain = `${start ? "…" : ""}${content.slice(start, start + 180)}${content.length > start + 180 ? "…" : ""}`;
    const pattern = terms
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"))
        .sort((a, b) => b.length - a.length)
        .join("|");
    const regex = new RegExp(pattern, "giu");
    let end = 0;
    let highlighted = "";
    for (const match of plain.matchAll(regex)) {
        highlighted +=
            escapeHtml(plain.slice(end, match.index)) + `<mark>${escapeHtml(match[0])}</mark>`;
        end = match.index + match[0].length;
    }
    return { plain_excerpt: plain, excerpt: highlighted + escapeHtml(plain.slice(end)) };
}

export function createEnhancedSearch(
    native: Promise<NativeSearch> | (() => Promise<NativeSearch>),
    base = import.meta.env.BASE_URL,
    request: typeof fetch = fetch,
    language = () => document.documentElement.lang,
) {
    const getNative = () => (typeof native === "function" ? native() : native);
    const directory = sitePath("pagefind/cjk/", base);
    const cache = new Map<string, Promise<unknown>>();
    function json<T>(file: string): Promise<T> {
        let pending = cache.get(file);
        if (!pending) {
            pending = request(directory + file).then((response) => {
                if (!response.ok) throw new Error(`CJK index HTTP ${response.status}`);
                return response.json();
            });
            cache.set(file, pending);
            void pending.catch(() => cache.delete(file));
        }
        return pending as Promise<T>;
    }
    const ids = new Map<string, Promise<string | undefined>>();
    async function nativeId(api: NativeSearch, record: CjkDocument, original: SearchResult[]) {
        const post = record.filters.post?.[0];
        if (post) {
            let pending = ids.get(record.url);
            if (!pending) {
                pending = api
                    .search(null, { filters: { post } })
                    .then((result) => result.results[0]?.id);
                ids.set(record.url, pending);
                void pending.catch(() => ids.delete(record.url));
            }
            return pending;
        }
        // Non-post pages are uncommon; resolve existing hits only to avoid duplicate URLs.
        for (const result of original) {
            if ((await result.data()).url.replace(/\/$/u, "") === record.url.replace(/\/$/u, ""))
                return result.id;
        }
    }
    async function search(query: string | null, options?: SearchOptions): Promise<SearchResponse> {
        const api = await getNative();
        if (query === null || !query.trim()) return api.search(query, options);
        const normalized = normalizeSearch(query);
        let original = await api.search(query, options);
        // Keep Pagefind's quoted phrase semantics and compound filter semantics intact.
        if (
            /["“”]/u.test(query) ||
            Object.values(options?.filters ?? {}).some((value) => value.length)
        )
            return original;
        if (normalized !== query) {
            const variant = await api.search(normalized, options);
            const originalIds = new Set(original.results.map((result) => result.id));
            const results = [
                ...original.results,
                ...variant.results.filter((result) => !originalIds.has(result.id)),
            ];
            original = { ...original, results, unfilteredTotalCount: results.length };
        }
        if (!CJK.test(normalized)) return original;
        try {
            const manifest = await json<CjkManifest>("manifest.json");
            const grams = cjkGrams(normalized);
            const shardKeys = [...new Set(grams.map(gramShard))];
            const shards = new Map(
                await Promise.all(
                    shardKeys.map(
                        async (key) =>
                            [
                                key,
                                manifest.shards[key]
                                    ? await json<Record<string, number[]>>(
                                          manifest.shards[key] as string,
                                      )
                                    : {},
                            ] as const,
                    ),
                ),
            );
            const lists = grams
                .map((gram) => shards.get(gramShard(gram))?.[gram] ?? [])
                .sort((a, b) => a.length - b.length);
            let candidates = new Set(lists[0] ?? []);
            for (const list of lists.slice(1)) {
                const allowed = new Set(list);
                candidates = new Set([...candidates].filter((id) => allowed.has(id)));
            }
            const terms = normalized.split(" ").filter(Boolean);
            const matches: Array<{ record: CjkDocument; content: string; score: number }> = [];
            // Bound text downloads independently of result count. Text is fetched only for n-gram candidates.
            const pending = [...candidates];
            let cursor = 0;
            await Promise.all(
                Array.from({ length: Math.min(6, pending.length) }, async () => {
                    while (cursor < pending.length) {
                        const record = manifest.documents[pending[cursor++] as number];
                        if (!record || record.language.toLowerCase() !== language().toLowerCase())
                            continue;
                        const { content } = await json<{ content: string }>(record.file);
                        const normalizedContent = normalizeSearch(content);
                        if (!terms.every((term) => normalizedContent.includes(term))) continue;
                        const title = normalizeSearch(record.title);
                        const description = normalizeSearch(record.description);
                        const score =
                            title === normalized
                                ? 100
                                : title.includes(normalized)
                                  ? 80
                                  : terms.every((term) => title.includes(term))
                                    ? 60
                                    : terms.every((term) => description.includes(term))
                                      ? 40
                                      : 20;
                        matches.push({ record, content, score });
                    }
                }),
            );
            matches.sort((a, b) => b.score - a.score || a.record.url.localeCompare(b.record.url));
            const supplemental: SearchResult[] = [];
            for (const { record, content } of matches) {
                const id = await nativeId(api, record, original.results);
                supplemental.push({
                    id: id ?? `cjk:${record.url}`,
                    data: () =>
                        Promise.resolve({
                            url: record.url,
                            meta: { title: record.title },
                            content,
                            filters: record.filters,
                            ...excerpt(content, terms),
                        }),
                });
            }
            const seen = new Set(supplemental.map((result) => result.id));
            const results = [
                ...supplemental,
                ...original.results.filter((result) => !seen.has(result.id)),
            ];
            return { ...original, results, unfilteredTotalCount: results.length };
        } catch {
            logger.warn("CJK substring index unavailable; using Pagefind");
            return original;
        }
    }
    return {
        search,
        options: async (options: Record<string, unknown>) => (await getNative()).options(options),
        filters: async () => (await getNative()).filters(),
        mergeIndex: async (url: string, options?: Record<string, unknown>) =>
            (await getNative()).mergeIndex(url, options),
    };
}
