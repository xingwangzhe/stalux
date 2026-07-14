import rss from "@astrojs/rss";
import { createTranslator, langToFeedLanguage } from "@utils/i18n";
import { buildFeedItems } from "@utils/feed";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async (context) => {
    const configCollection = await getCollection("config");
    const stalux = configCollection[0]?.data;

    const posts = await getCollection("posts", ({ data }) => !data.draft);
    const items = await buildFeedItems(stalux, posts, "updated");

    const lang = stalux?.lang || "zh-CN";
    const { t } = createTranslator(lang);

    return rss({
        title: stalux?.title || "Stalux Blog",
        description: stalux?.description || "A blog powered by Stalux theme",
        site: context.site?.toString() || stalux?.url || "https://stalux.needhelp.icu",
        items,
        customData: `<language>${langToFeedLanguage(lang)}</language>\n<copyright>${t("rss.copyright")}</copyright>`,
        xmlns: {
            atom: "http://www.w3.org/2005/Atom",
        },
    });
};
