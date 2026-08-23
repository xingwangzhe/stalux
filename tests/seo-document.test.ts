import { describe, expect, it } from "vitest";

import { authorSchema, siteSchema } from "../src/schemas/config";
import { buildSeoDocument, type SeoDocumentInput } from "../src/utils/seo-document";

const site = siteSchema.parse({
    id: "site",
    title: "Stalux",
    seoTitle: "Stalux SEO Title",
    url: "https://example.com/",
    description: "A tested site",
    lang: "zh-CN",
    favicon: "/favicon.ico",
});
const author = authorSchema.parse({
    id: "author",
    name: "Tester",
    avatar: "/avatar.png",
    bio: "Writes tests",
    jobTitle: "Engineer",
});

function input(overrides: Partial<SeoDocumentInput> = {}): SeoDocumentInput {
    return {
        site,
        author,
        mediaLinks: ["https://github.com/example", "mailto:test@example.com"],
        page: { title: "Page", description: "Page description" },
        pathname: "/",
        protocol: "https:",
        exportMarkdown: true,
        version: "9.8.7",
        ...overrides,
    };
}

describe("SEO document", () => {
    it("builds home metadata from validated config", () => {
        const document = buildSeoDocument(input());
        expect(document.title).toBe("Stalux SEO Title");
        expect(document.canonical).toBe("https://example.com/");
        expect(document.noindex).toBe(false);
        expect(document.nofollow).toBe(false);
        expect(document.meta).toContainEqual({ name: "stalux-version", content: "9.8.7" });
        expect(document.links).toContainEqual({
            rel: "alternate",
            type: "text/markdown",
            title: "Markdown source",
            href: "/index.md",
        });
        expect(document.schema["@context"]).toBe("https://schema.org");
    });

    it("uses real taxonomy index Markdown routes", () => {
        const tags = buildSeoDocument(input({ pathname: "/tags/" }));
        const categories = buildSeoDocument(input({ pathname: "/categories/" }));
        expect(tags.links).toContainEqual(expect.objectContaining({ href: "/tags/index.md" }));
        expect(categories.links).toContainEqual(
            expect.objectContaining({ href: "/categories/index.md" }),
        );
    });

    it("builds article Open Graph and BlogPosting data", () => {
        const document = buildSeoDocument(
            input({
                pathname: "/posts/test/",
                page: {
                    title: "Article | Stalux",
                    description: "Article description",
                    cover: "/cover.webp",
                    isArticle: true,
                    date: "2026-01-01T00:00:00+08:00",
                    updated: "2026-01-02T00:00:00+08:00",
                    tags: ["Astro", "SEO"],
                    categories: ["Engineering"],
                    author: "Tester",
                },
            }),
        );
        expect(document.openGraph.basic).toMatchObject({
            title: "Article",
            type: "article",
            image: "https://example.com/cover.webp",
        });
        expect(document.twitter.card).toBe("summary_large_image");
        const graph = document.schema["@graph"] as Array<Record<string, unknown>>;
        expect(graph).toContainEqual(
            expect.objectContaining({
                "@type": "BlogPosting",
                dateModified: "2026-01-02T00:00:00+08:00",
                keywords: "Astro, SEO",
            }),
        );
    });

    it("forces 404 pages to noindex and nofollow", () => {
        const document = buildSeoDocument(input({ pathname: "/404/" }));
        expect(document.noindex).toBe(true);
        expect(document.nofollow).toBe(true);
        expect(document.meta.some((item) => item.name === "googlebot")).toBe(false);
        expect(document.links.some((item) => item.type === "text/markdown")).toBe(false);
    });

    it("honors canonical domains and protocol-relative images", () => {
        const canonicalSite = siteSchema.parse({
            ...site,
            canonical: "https://canonical.example/",
        });
        const document = buildSeoDocument(
            input({
                site: canonicalSite,
                pathname: "/about/",
                page: { title: "About", description: "About page", cover: "//cdn.example/a.webp" },
            }),
        );
        expect(document.canonical).toBe("https://canonical.example/about/");
        expect(document.openGraph.basic.image).toBe("https://cdn.example/a.webp");
        const graph = document.schema["@graph"] as Array<Record<string, unknown>>;
        expect(graph).toContainEqual(expect.objectContaining({ "@type": "AboutPage" }));
    });

    it("normalizes query, hash, trailing slash, and Unicode canonical input", () => {
        const document = buildSeoDocument(
            input({ pathname: "/tags/%E6%B5%8B%E8%AF%95/?from=nav#top" }),
        );
        expect(document.canonical).toBe("https://example.com/tags/%E6%B5%8B%E8%AF%95/");
        expect(document.schema["@graph"]).toEqual(
            expect.arrayContaining([expect.objectContaining({ "@type": "CollectionPage" })]),
        );
    });

    it("uses site and page robots flags without inventing googlebot directives", () => {
        const restrictedSite = siteSchema.parse({
            ...site,
            noindex: true,
            nofollow: true,
            twitterSite: "@stalux",
        });
        const document = buildSeoDocument(
            input({ site: restrictedSite, page: { ...input().page, noindex: true } }),
        );
        expect(document.noindex).toBe(true);
        expect(document.nofollow).toBe(true);
        expect(document.twitter.site).toBe("@stalux");
        expect(document.meta.some((item) => item.name === "googlebot")).toBe(false);
    });

    it("omits optional article fields instead of serializing empty values", () => {
        const document = buildSeoDocument(
            input({
                pathname: "/posts/minimal/",
                page: {
                    title: "Minimal",
                    description: "No invented dates or taxonomy",
                    isArticle: true,
                },
            }),
        );
        expect(document.openGraph.article).toEqual({});
        const graph = document.schema["@graph"] as Array<Record<string, unknown>>;
        const article = graph.find((entity) => entity["@type"] === "BlogPosting");
        expect(article).not.toHaveProperty("datePublished");
        expect(article).not.toHaveProperty("dateModified");
        expect(article).not.toHaveProperty("keywords");
        expect(article).not.toHaveProperty("articleSection");
    });

    it("uses publication date as the modified-date fallback", () => {
        const document = buildSeoDocument(
            input({
                pathname: "/posts/dated/",
                page: {
                    title: "Dated",
                    description: "Published but not updated",
                    isArticle: true,
                    date: "2026-02-03T04:05:06.000Z",
                    categories: ["Astro"],
                },
            }),
        );
        const graph = document.schema["@graph"] as Array<Record<string, unknown>>;
        expect(graph).toContainEqual(
            expect.objectContaining({
                "@type": "BlogPosting",
                datePublished: "2026-02-03T04:05:06.000Z",
                dateModified: "2026-02-03T04:05:06.000Z",
            }),
        );
        const breadcrumb = graph.find((entity) => entity["@type"] === "BreadcrumbList");
        expect(breadcrumb?.itemListElement).toHaveLength(3);
    });

    it("does not emit Markdown alternates when exporting is disabled", () => {
        const document = buildSeoDocument(input({ exportMarkdown: false, pathname: "/about/" }));
        expect(document.links.some((item) => item.type === "text/markdown")).toBe(false);
        expect(document.schema["@graph"]).toEqual(
            expect.arrayContaining([expect.objectContaining({ "@type": "AboutPage" })]),
        );
    });

    it("uses the avatar and a compact Twitter card when no cover exists", () => {
        const document = buildSeoDocument(input({ pathname: "/archives/" }));
        expect(document.openGraph.basic.image).toBe("https://example.com/avatar.png");
        expect(document.twitter.card).toBe("summary");
        expect(document.schema["@graph"]).toEqual(
            expect.arrayContaining([expect.objectContaining({ "@type": "WebPage" })]),
        );
    });
});
