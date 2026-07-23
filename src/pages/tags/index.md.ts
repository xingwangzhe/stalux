import {
    buildTaxonomyMap,
    getPublishedPosts,
    getSite,
    loadConfig,
    renderTaxonomyListMd,
} from "@utils/ai-discovery";
import { createTranslator } from "@utils/i18n";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async (context) => {
    const config = await loadConfig();
    const site = getSite(config, context.site?.toString());
    const lang = (config.get("site")?.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const posts = await getPublishedPosts();
    const map = buildTaxonomyMap(posts, "tags");
    const text = renderTaxonomyListMd(map, site, "tags", t("ai.allTags"));
    return new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};
