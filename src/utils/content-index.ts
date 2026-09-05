import { type CollectionEntry, getCollection } from "astro:content";
import type { AstroRuntimeLogger } from "astro";
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
): void {
    const timestamp = toTimestamp(post.data.updated ?? post.data.date);
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
): PostContentIndex<T> {
    const posts = [...sourcePosts].sort(
        (left, right) => toTimestamp(right.data.date) - toTimestamp(left.data.date),
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
        addToTaxonomy(tags, post, post.data.tags);
        addToTaxonomy(categories, post, post.data.categories);
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
    const posts = await getCollection("posts", ({ data }) => !data.draft);
    const started = performance.now();
    const index = buildPostContentIndex(posts);
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
