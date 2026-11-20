import { load, type RawData } from "@orama/orama";
import { createSearchIndex, searchDocuments } from "../utils/orama-search";
import { sitePath } from "../utils/site-path";

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
    function index() {
        pending ??= loadOramaSearch(base, request).catch((error: unknown) => {
            pending = undefined;
            throw error;
        });
        return pending;
    }
    return {
        ready: index,
        async search(query: string, post?: string) {
            const { cjk, count, database } = await index();
            return searchDocuments(database, query, {
                cjk,
                language: language(),
                limit: count,
                ...(post ? { post } : {}),
            });
        },
    };
}
