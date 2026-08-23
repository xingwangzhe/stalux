export interface RouteDefinition {
    pattern: string;
    source: string;
}

/** Complete plugin-mode route catalog. Browser-safe so public route helpers can share it. */
export const ROUTE_DEFINITIONS: readonly RouteDefinition[] = [
    { pattern: "/", source: "./pages/index.astro" },
    { pattern: "/about/", source: "./pages/about.astro" },
    { pattern: "/archives/", source: "./pages/archives.astro" },
    { pattern: "/links/", source: "./pages/links.astro" },
    { pattern: "/words/", source: "./pages/words.astro" },
    { pattern: "/404", source: "./pages/404.astro" },
    { pattern: "/posts/[post]", source: "./pages/posts/[post].astro" },
    { pattern: "/tags/", source: "./pages/tags/index.astro" },
    { pattern: "/tags/[tag]", source: "./pages/tags/[tag].astro" },
    { pattern: "/categories/", source: "./pages/categories/index.astro" },
    { pattern: "/categories/[category]", source: "./pages/categories/[category].astro" },
    { pattern: "/rss.xml", source: "./pages/rss.xml.ts" },
    { pattern: "/atom.xml", source: "./pages/atom.xml.ts" },
    { pattern: "/llms.txt", source: "./pages/llms.txt.ts" },
    { pattern: "/llms-full.txt", source: "./pages/llms-full.txt.ts" },
    { pattern: "/openapi.json", source: "./pages/openapi.json.ts" },
    { pattern: "/api/post.abbrlink.json", source: "./pages/api/post.abbrlink.json.ts" },
    { pattern: "/api/posts.json", source: "./pages/api/posts.json.ts" },
    { pattern: "/index.md", source: "./pages/index.md.ts" },
    { pattern: "/about.md", source: "./pages/about.md.ts" },
    { pattern: "/archives.md", source: "./pages/archives.md.ts" },
    { pattern: "/links.md", source: "./pages/links.md.ts" },
    { pattern: "/words.md", source: "./pages/words.md.ts" },
    { pattern: "/tags/index.md", source: "./pages/tags/index.md.ts" },
    { pattern: "/tags/[tag].md", source: "./pages/tags/[tag].md.ts" },
    { pattern: "/categories/index.md", source: "./pages/categories/index.md.ts" },
    { pattern: "/categories/[category].md", source: "./pages/categories/[category].md.ts" },
    { pattern: "/posts/[post].md", source: "./pages/posts/[post].md.ts" },
] as const;
