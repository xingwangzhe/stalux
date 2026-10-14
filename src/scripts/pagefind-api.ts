import { sitePath } from "../utils/site-path";
import { createClientLogger } from "./logger";

export interface PagefindData {
    url: string;
    meta?: { title?: string };
    plain_excerpt?: string;
    content?: string;
}

export interface PagefindApi {
    search: (
        query: string | null,
        options?: { filters?: Record<string, string> },
    ) => Promise<{
        results: Array<{ data: () => Promise<PagefindData> }>;
    }>;
}

/** Share successful imports and in-flight work; a failed attempt remains retryable. */
export function createPagefindLoader(
    importModule: (url: string) => Promise<unknown> = (url) => import(/* @vite-ignore */ url),
    origin: () => string = () => location.origin,
    base = import.meta.env.BASE_URL,
): () => Promise<PagefindApi | null> {
    let pending: Promise<PagefindApi | null> | undefined;
    let failedAttempts = 0;
    const logger = createClientLogger("webmcp/pagefind");
    return () => {
        if (!pending) {
            pending = (async () => {
                try {
                    const url = new URL(sitePath("pagefind/pagefind.js", base), origin());
                    // Browsers can retain a failed ESM fetch; retry with a fresh module URL.
                    if (failedAttempts)
                        url.searchParams.set("stalux_retry", String(failedAttempts));
                    const loaded = await importModule(url.href);
                    const namespace = loaded as {
                        default?: PagefindApi;
                        search?: PagefindApi["search"];
                    };
                    const api = namespace.default ?? namespace;
                    if (typeof api.search !== "function")
                        throw new Error("Invalid Pagefind module");
                    return api as PagefindApi;
                } catch {
                    failedAttempts++;
                    logger.warn(
                        "Pagefind index unavailable; build the static search index and retry",
                    );
                    return null;
                }
            })();
            const attempt = pending;
            void attempt.then((result) => {
                if (!result && pending === attempt) pending = undefined;
            });
        }
        return pending;
    };
}

export const loadPagefind = createPagefindLoader();
