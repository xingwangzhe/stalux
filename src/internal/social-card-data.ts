import type { AuthorData, SiteData } from "../schemas/config";
import { formatInTimeZone, parseDate } from "../utils/dayjs";
import type { SocialCardData } from "../utils/social-image";

interface PostData {
    title: string;
    date: string;
    abbrlink: string;
    cover?: string;
    categories?: string[];
    tags?: string[];
}

export function createSocialCardData(
    post: PostData,
    site: SiteData,
    author: AuthorData,
): SocialCardData {
    const siteUrl = new URL(site.canonical ?? site.url);
    return {
        title: post.title,
        siteTitle: site.title,
        author: author.name,
        host: siteUrl.host,
        postUrl: new URL(`/posts/${encodeURIComponent(post.abbrlink)}`, siteUrl).href,
        tags: post.tags ?? [],
        date: formatInTimeZone(
            parseDate(post.date, site.timezone || "Asia/Shanghai"),
            site.timezone || "Asia/Shanghai",
            "yyyy-MM-dd",
        ),
        category: post.categories?.[0] ?? "",
        ...(post.cover?.trim() ? { cover: post.cover.trim() } : {}),
    };
}
