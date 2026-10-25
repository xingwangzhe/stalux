import { describe, expect, it } from "vitest";
import { createSocialCardData } from "../src/internal/social-card-data";
import { localCoverPath } from "../src/internal/social-card-renderer";
import { authorSchema, siteSchema } from "../src/schemas/config";
import { reconstructMarkdown } from "../src/utils/post-markdown";
import { buildSeoDocument } from "../src/utils/seo-document";
import {
    isSocialImageUrl,
    resolvePostSocialImage,
    socialCardPath,
} from "../src/utils/social-image";

const site = siteSchema.parse({
    id: "site",
    title: "中文博客",
    url: "https://example.com",
    lang: "zh-CN",
    timezone: "Asia/Shanghai",
    description: "Blog",
    favicon: "/favicon.ico",
});
const author = authorSchema.parse({
    id: "author",
    name: "Tester",
    avatar: "/avatar.png",
    bio: "Tests",
});
const post = {
    title: "中文标题与 Astro",
    desc: "摘要",
    date: "2026-10-24 23:55:00",
    cover: "/封面.webp",
};
const card = createSocialCardData(post, site, author);

describe("article social images", () => {
    it("gives explicit OG art priority over the article cover", () => {
        expect(resolvePostSocialImage(" /social.png ", card)).toEqual({ url: "/social.png" });
        expect(
            reconstructMarkdown({ ...post, abbrlink: "test", "og:image": "/social.png" }),
        ).toContain("og:image: /social.png");
    });
    it("generates a WebP for covers and coverless posts, including base paths", () => {
        expect(resolvePostSocialImage(undefined, card)).toMatchObject({
            width: 1200,
            height: 630,
            type: "image/webp",
        });
        expect(socialCardPath(card, "/blog/")).toMatch(/^\/blog\/og\/[a-f0-9]{20}\.webp$/u);
        expect(socialCardPath({ ...card, cover: undefined })).not.toBe(socialCardPath(card));
        expect(socialCardPath({ ...card, title: "新标题" })).not.toBe(socialCardPath(card));
        expect(resolvePostSocialImage(" ", card).url).toBe(socialCardPath(card));
    });
    it("keeps dates in the site timezone on a UTC build machine", () => {
        expect(card.date).toBe("2026-10-24");
        expect(
            createSocialCardData({ ...post, date: "2026-10-24T16:30:00Z" }, site, author).date,
        ).toBe("2026-10-25");
    });
    it("restricts explicit image URLs and resolves encoded public paths safely", () => {
        for (const value of [
            "javascript:alert(1)",
            "data:image/png;base64,x",
            "relative.png",
            "https://x.test/a.png title",
            "",
        ])
            expect(isSocialImageUrl(value)).toBe(false);
        for (const value of ["/social.png", "https://cdn.test/a.png", "//cdn.test/a.png"])
            expect(isSocialImageUrl(value)).toBe(true);
        const paths = {
            publicDir: "/tmp/public",
            cacheDir: "/tmp/cache",
            base: "/blog/",
            fontPath: "unused",
        };
        expect(localCoverPath("/blog/%E5%B0%81%E9%9D%A2.webp?x=1", paths)).toBe(
            "/tmp/public/封面.webp",
        );
        expect(localCoverPath("/%2e%2e/private.png", paths)).toBeUndefined();
        expect(localCoverPath("/%zz.png", paths)).toBeUndefined();
    });
    it("uses one image consistently for OG, Twitter and BlogPosting", () => {
        const socialImage = resolvePostSocialImage(undefined, card);
        const seo = buildSeoDocument({
            site,
            author,
            mediaLinks: [],
            page: {
                title: post.title,
                description: post.desc,
                cover: post.cover,
                socialImage,
                isArticle: true,
            },
            pathname: "/posts/test",
            protocol: "https:",
            exportMarkdown: true,
            version: "test",
        });
        const url = `https://example.com${socialImage.url}`;
        expect(seo.openGraph.basic.image).toBe(url);
        expect(seo.openGraph.image).toMatchObject({
            url,
            width: 1200,
            height: 630,
            type: "image/webp",
        });
        expect(seo.twitter).toMatchObject({ image: url, card: "summary_large_image" });
        expect(seo.schema["@graph"]).toContainEqual(
            expect.objectContaining({ "@type": "BlogPosting", image: url }),
        );
    });
});
