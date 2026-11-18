import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { getSiteData } from "@utils/config-utils";
import { buildFeedItems } from "@utils/feed";
import { createTranslator, langToFeedLanguage } from "@utils/i18n";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ logger }) => {
    const configCollection = await getCollection("config");
    const stalux = getSiteData(configCollection);

    const posts = await getCollection("posts", ({ data }) => !data.draft);
    const items = await buildFeedItems(stalux, posts, "updated", logger);

    const lang = stalux?.lang || "zh-CN";
    const { t } = createTranslator(lang);

    return rss({
        title: stalux?.title || "Stalux Blog",
        description: stalux?.description || "A blog powered by Stalux theme",
        site: stalux.url,
        // 条目使用绝对规范 URL，频道链接使用站点根路径。
        trailingSlash: true,
        items,
        customData: `<language>${langToFeedLanguage(lang)}</language>\n<copyright>${t("rss.copyright")}</copyright>`,
        xmlns: {
            atom: "http://www.w3.org/2005/Atom",
        },
    });
};
