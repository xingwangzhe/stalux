import type { AuthorData, SiteData } from "@schemas/config";
import type { SEOProps } from "astro-seo";

import { langToOpenGraphLocale } from "./i18n";
import { getMarkdownPath, getRouteKind, normalizePublicPath } from "./public-routes";

export type TwitterCardType = "summary" | "summary_large_image";

export interface SeoPageInput {
    title: string;
    description: string;
    cover?: string;
    isArticle?: boolean;
    date?: string;
    updated?: string;
    tags?: string[];
    categories?: string[];
    author?: string;
    noindex?: boolean;
}

export interface SeoDocumentInput {
    site: SiteData;
    author: AuthorData;
    mediaLinks: string[];
    page: SeoPageInput;
    pathname: string;
    protocol: string;
    exportMarkdown: boolean;
    version: string;
}

export interface SeoDocument {
    title: string;
    description: string;
    canonical: string;
    nofollow: boolean;
    noindex: boolean;
    openGraph: NonNullable<SEOProps["openGraph"]>;
    twitter: NonNullable<SEOProps["twitter"]>;
    links: NonNullable<NonNullable<SEOProps["extend"]>["link"]>;
    meta: NonNullable<NonNullable<SEOProps["extend"]>["meta"]>;
    schema: Record<string, unknown>;
}

function normalizeSiteUrl(value: string): string {
    return new URL(value).href.replace(/\/+$/, "");
}

function absoluteUrl(value: string, base: string, protocol: string): string {
    if (value.startsWith("//")) return `${protocol}${value}`;
    return new URL(value, `${base}/`).href;
}

export function buildSeoDocument(input: SeoDocumentInput): SeoDocument {
    const { site, author, page, pathname, exportMarkdown, version } = input;
    const routeKind = getRouteKind(pathname);
    const siteUrl = normalizeSiteUrl(site.canonical ?? site.url);
    const normalizedPath = normalizePublicPath(pathname);
    const canonicalPath = normalizedPath === "/" ? "/" : `${normalizedPath}/`;
    const canonical = new URL(canonicalPath, `${siteUrl}/`).href;
    const title = routeKind === "home" && site.seoTitle ? site.seoTitle : page.title;
    const siteName = site.title;
    const siteTitleSuffix = ` | ${site.title}`;
    const contentTitle =
        siteTitleSuffix && title.endsWith(siteTitleSuffix)
            ? title.slice(0, -siteTitleSuffix.length)
            : title;
    const notFound = routeKind === "not-found";
    const noindex = Boolean(site.noindex) || notFound || Boolean(page.noindex);
    const nofollow = Boolean(site.nofollow) || notFound;
    const favicon = site.favicon;
    const image = absoluteUrl(page.cover ?? author.avatar, siteUrl, input.protocol);
    const isArticle = page.isArticle ?? false;
    const isCollection = routeKind.endsWith("-index") || routeKind.endsWith("-detail");

    const openGraph: NonNullable<SEOProps["openGraph"]> = {
        basic: {
            title: contentTitle,
            type: isArticle ? "article" : "website",
            image,
            url: canonical,
        },
        optional: {
            description: page.description,
            locale: langToOpenGraphLocale(site.lang),
            siteName,
        },
        image: { url: image, alt: contentTitle },
    };
    if (isArticle) {
        openGraph.article = {
            ...(page.date ? { publishedTime: page.date } : {}),
            ...(page.updated ? { modifiedTime: page.updated } : {}),
            ...(page.author ? { authors: [page.author] } : {}),
            ...(page.categories?.length ? { section: page.categories[0] } : {}),
            ...(page.tags?.length ? { tags: page.tags } : {}),
        };
    }

    const twitter = {
        card: (page.cover ? "summary_large_image" : "summary") as TwitterCardType,
        title: contentTitle,
        description: page.description,
        image,
        imageAlt: contentTitle,
        ...(site.twitterSite ? { site: site.twitterSite } : {}),
    };
    const links: NonNullable<NonNullable<SEOProps["extend"]>["link"]> = [
        { rel: "icon", href: favicon },
        {
            rel: "alternate",
            type: "application/rss+xml",
            title: site.title,
            href: "/rss.xml",
        },
    ];
    const markdownPath = exportMarkdown ? getMarkdownPath(pathname) : undefined;
    if (markdownPath) {
        links.push({
            rel: "alternate",
            type: "text/markdown",
            title: "Markdown source",
            href: markdownPath,
        });
    }

    const meta = [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "color-scheme", content: "dark" },
        { name: "generator", content: `Stalux ${version}` },
        { name: "theme", content: "Stalux" },
        { name: "stalux-version", content: version },
        ...(!noindex
            ? [
                  {
                      name: "googlebot",
                      content: "max-image-preview:large, max-snippet:-1, max-video-preview:-1",
                  },
              ]
            : []),
    ];

    const sameAs = input.mediaLinks.filter((link) => /^https?:\/\//i.test(link));
    const authorImage = absoluteUrl(author.avatar, siteUrl, input.protocol);
    const authorEntity = {
        "@type": "Person",
        "@id": `${siteUrl}/#author`,
        name: author.name,
        url: `${siteUrl}/about/`,
        image: authorImage,
        ...(sameAs.length ? { sameAs } : {}),
        ...(author.jobTitle ? { jobTitle: author.jobTitle } : {}),
    };
    const publisher = {
        "@type": "Organization",
        "@id": `${siteUrl}/#publisher`,
        name: siteName,
        url: siteUrl,
        logo: authorImage,
    };
    const websiteEntity = {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: siteName,
        description: site.description,
        inLanguage: site.lang,
        publisher: { "@id": `${siteUrl}/#publisher` },
    };
    const breadcrumbItems: Record<string, unknown>[] = [
        { "@type": "ListItem", position: 1, name: siteName, item: `${siteUrl}/` },
    ];
    if (isArticle && page.categories?.[0]) {
        breadcrumbItems.push({
            "@type": "ListItem",
            position: breadcrumbItems.length + 1,
            name: page.categories[0],
            item: `${siteUrl}/categories/${encodeURIComponent(page.categories[0])}/`,
        });
    }
    if (routeKind !== "home") {
        breadcrumbItems.push({
            "@type": "ListItem",
            position: breadcrumbItems.length + 1,
            name: contentTitle,
            item: canonical,
        });
    }
    const breadcrumbEntity = {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: breadcrumbItems,
    };

    let schema: Record<string, unknown>;
    if (isArticle) {
        schema = {
            "@context": "https://schema.org",
            "@graph": [
                websiteEntity,
                authorEntity,
                publisher,
                breadcrumbEntity,
                {
                    "@type": "BlogPosting",
                    "@id": `${canonical}#article`,
                    headline: contentTitle,
                    description: page.description,
                    url: canonical,
                    image,
                    ...(page.date ? { datePublished: page.date } : {}),
                    ...(page.updated || page.date
                        ? { dateModified: page.updated || page.date }
                        : {}),
                    ...(page.tags?.length ? { keywords: page.tags.join(", ") } : {}),
                    ...(page.categories?.length ? { articleSection: page.categories } : {}),
                    author: {
                        "@id": `${siteUrl}/#author`,
                        ...(page.author ? { name: page.author } : {}),
                    },
                    publisher: { "@id": `${siteUrl}/#publisher` },
                    isPartOf: { "@id": `${siteUrl}/#website` },
                    inLanguage: site.lang,
                    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
                },
            ],
        };
    } else if (routeKind === "home") {
        schema = {
            "@context": "https://schema.org",
            "@graph": [websiteEntity, authorEntity, publisher],
        };
    } else {
        schema = {
            "@context": "https://schema.org",
            "@graph": [
                websiteEntity,
                authorEntity,
                publisher,
                breadcrumbEntity,
                {
                    "@type": isCollection
                        ? "CollectionPage"
                        : routeKind === "about"
                          ? "AboutPage"
                          : "WebPage",
                    "@id": canonical,
                    url: canonical,
                    name: contentTitle,
                    description: page.description,
                    inLanguage: site.lang,
                    isPartOf: { "@id": `${siteUrl}/#website` },
                    breadcrumb: { "@id": `${canonical}#breadcrumb` },
                },
            ],
        };
    }

    return {
        title,
        description: page.description,
        canonical,
        nofollow,
        noindex,
        openGraph,
        twitter,
        links,
        meta,
        schema,
    };
}
