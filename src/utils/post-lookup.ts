interface SearchablePost {
    abbrlink: string;
    title: string;
    tags?: string[];
    categories?: string[];
    desc?: string;
}

/** One immutable snapshot; duplicate IDs and fuzzy matches keep first-match order. */
export function createPostLookup<T extends SearchablePost>(posts: readonly T[]) {
    const byId = new Map<string, T>();
    const searchable = posts.map((post) => {
        if (!byId.has(post.abbrlink)) byId.set(post.abbrlink, post);
        return {
            post,
            title: post.title.toLowerCase(),
            tags: post.tags?.map((tag) => tag.toLowerCase()) ?? [],
            categories: post.categories?.map((category) => category.toLowerCase()) ?? [],
            description: post.desc?.toLowerCase() ?? "",
        };
    });
    return {
        findById: (id: string): T | undefined => byId.get(id),
        findMatches(keyword: string, limit: number): T[] {
            const query = keyword.toLowerCase();
            const titles: T[] = [];
            const other: T[] = [];
            for (const entry of searchable) {
                if (entry.title.includes(query)) {
                    titles.push(entry.post);
                    if (titles.length >= limit) break;
                } else if (
                    other.length < limit &&
                    (entry.tags.some((tag) => tag.includes(query)) ||
                        entry.categories.some((category) => category.includes(query)) ||
                        entry.description.includes(query))
                ) {
                    other.push(entry.post);
                }
            }
            return [...titles, ...other].slice(0, limit);
        },
        findByKeyword(keyword: string): T | undefined {
            const query = keyword.toLowerCase();
            return (
                searchable.find(({ title }) => title.includes(query)) ??
                searchable.find(({ tags }) => tags.some((tag) => tag.includes(query)))
            )?.post;
        },
    };
}
