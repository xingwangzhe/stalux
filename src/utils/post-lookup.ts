interface SearchablePost {
    abbrlink: string;
    title: string;
    tags?: string[];
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
        };
    });
    return {
        findById: (id: string): T | undefined => byId.get(id),
        findByKeyword(keyword: string): T | undefined {
            const query = keyword.toLowerCase();
            return (
                searchable.find(({ title }) => title.includes(query)) ??
                searchable.find(({ tags }) => tags.some((tag) => tag.includes(query)))
            )?.post;
        },
    };
}
