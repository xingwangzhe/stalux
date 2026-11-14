import { type CollectionEntry, getCollection } from "astro:content";
import type { AstroRuntimeLogger } from "astro";
import { getSiteData } from "./config-utils";
import { toTimestamp } from "./dayjs";
import { logDetail } from "./diagnostics";

export type PostEntry = CollectionEntry<"posts">;
export type TaxonomyKey = "tags" | "categories";

export interface TaxonomyBucket<T> {
    name: string;
    posts: T[];
    latestTime: string;
    cacheKey: string;
}

export interface PostNeighbors<T> {
    previous?: T;
    next?: T;
}

export interface PostContentIndex<T> {
    posts: T[];
    byAbbrlink: ReadonlyMap<string, T>;
    tags: ReadonlyMap<string, TaxonomyBucket<T>>;
    categories: ReadonlyMap<string, TaxonomyBucket<T>>;
    neighbors: ReadonlyMap<string, PostNeighbors<T>>;
}

interface IndexablePost {
    data: {
        abbrlink: string | number;
        date: string;
        updated?: string;
        tags?: string[];
        categories?: string[];
    };
}

interface MutableTaxonomyBucket<T> {
    name: string;
    posts: T[];
    latestTime: string;
    latestTimestamp: number;
}

function addToTaxonomy<T extends IndexablePost>(
    map: Map<string, MutableTaxonomyBucket<T>>,
    post: T,
    names: string[] | undefined,
    timestamp: number,
): void {
    for (const name of new Set(names ?? [])) {
        const existing = map.get(name);
        if (existing) {
            existing.posts.push(post);
            if (timestamp > existing.latestTimestamp) {
                existing.latestTimestamp = timestamp;
                existing.latestTime = post.data.updated ?? post.data.date;
            }
        } else {
            map.set(name, {
                name,
                posts: [post],
                latestTime: post.data.updated ?? post.data.date,
                latestTimestamp: timestamp,
            });
        }
    }
}

function finalizeTaxonomy<T extends IndexablePost>(
    source: ReadonlyMap<string, MutableTaxonomyBucket<T>>,
): ReadonlyMap<string, TaxonomyBucket<T>> {
    return new Map(
        [...source].map(([name, bucket]) => [
            name,
            {
                name,
                posts: bucket.posts,
                latestTime: bucket.latestTime,
                cacheKey: bucket.posts
                    .map((post) => post.data.updated ?? post.data.date)
                    .sort()
                    .join("|"),
            },
        ]),
    );
}

/**
 * Build every reusable post lookup in one linear pass after one O(n log n) date sort.
 * Taxonomy membership is deduplicated per post, and duplicate permalinks fail fast.
 */
export function buildPostContentIndex<T extends IndexablePost>(
    sourcePosts: readonly T[],
    timeZone?: string,
): PostContentIndex<T> {
    const times = new Map<T, { date: number; updated: number }>();
    for (const post of sourcePosts) {
        // 无时区日期串必须按站点时区解析。漏传会按构建机器时区解释：
        // UTC 构建机上整体偏 8 小时；一旦与带偏移的日期混写，两者相差 8 小时，
        // 排序就会错——首页顺序、上一篇/下一篇、分类「最新」归属都跟着错。
        const date = toTimestamp(post.data.date, timeZone);
        times.set(post, {
            date,
            updated: post.data.updated == null ? date : toTimestamp(post.data.updated, timeZone),
        });
    }
    const posts = sourcePosts.toSorted(
        (left, right) => (times.get(right)?.date ?? 0) - (times.get(left)?.date ?? 0),
    );
    const byAbbrlink = new Map<string, T>();
    const tags = new Map<string, MutableTaxonomyBucket<T>>();
    const categories = new Map<string, MutableTaxonomyBucket<T>>();
    const neighbors = new Map<string, PostNeighbors<T>>();

    for (const [index, post] of posts.entries()) {
        const abbrlink = String(post.data.abbrlink);
        if (byAbbrlink.has(abbrlink)) {
            throw new Error(`Duplicate post abbrlink: ${abbrlink}`);
        }
        byAbbrlink.set(abbrlink, post);
        const timestamp = times.get(post)?.updated ?? 0;
        addToTaxonomy(tags, post, post.data.tags, timestamp);
        addToTaxonomy(categories, post, post.data.categories, timestamp);
        neighbors.set(abbrlink, {
            previous: posts[index + 1],
            next: index > 0 ? posts[index - 1] : undefined,
        });
    }

    return {
        posts,
        byAbbrlink,
        tags: finalizeTaxonomy(tags),
        categories: finalizeTaxonomy(categories),
        neighbors,
    };
}

let productionIndex: Promise<PostContentIndex<PostEntry>> | undefined;

async function loadPostContentIndex(
    logger?: AstroRuntimeLogger,
): Promise<PostContentIndex<PostEntry>> {
    const [posts, configEntries] = await Promise.all([
        getCollection("posts", ({ data }) => !data.draft),
        getCollection("config"),
    ]);
    const started = performance.now();
    // 站点时区与 feed / semantic-time / archives 同源（site.yml，缺省 Asia/Shanghai）
    const index = buildPostContentIndex(posts, getSiteData(configEntries).timezone);
    logDetail(
        logger,
        "content-index",
        `posts=${posts.length}; tags=${index.tags.size}; categories=${index.categories.size}; elapsed=${(performance.now() - started).toFixed(1)}ms`,
    );
    return index;
}

/** Production content is immutable during one build; dev deliberately bypasses the cache for HMR. */
export function getPostContentIndex(
    logger?: AstroRuntimeLogger,
): Promise<PostContentIndex<PostEntry>> {
    if (import.meta.env.DEV) {
        logDetail(logger, "content-index", "dev cache bypass");
        return loadPostContentIndex(logger);
    }
    logDetail(logger, "content-index", productionIndex ? "cache hit" : "cache miss");
    productionIndex ??= loadPostContentIndex(logger);
    return productionIndex;
}
