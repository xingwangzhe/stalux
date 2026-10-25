import type { AuthorData, SiteData } from "../schemas/config";
import { formatInTimeZone, parseDate } from "../utils/dayjs";
import type { SocialCardData } from "../utils/social-image";

interface PostData {
    title: string;
    desc: string;
    date: string;
    cover?: string;
    categories?: string[];
}

export function createSocialCardData(
    post: PostData,
    site: SiteData,
    author: AuthorData,
): SocialCardData {
    return {
        title: post.title,
        description: post.desc,
        siteTitle: site.title,
        author: author.name,
        host: new URL(site.canonical ?? site.url).host,
        lang: site.lang || "zh-CN",
        accent: site.accentColor || "#EAB308",
        date: formatInTimeZone(
            parseDate(post.date, site.timezone || "Asia/Shanghai"),
            site.timezone || "Asia/Shanghai",
            "yyyy-MM-dd",
        ),
        category: post.categories?.[0] ?? "",
        ...(post.cover?.trim() ? { cover: post.cover.trim() } : {}),
    };
}
