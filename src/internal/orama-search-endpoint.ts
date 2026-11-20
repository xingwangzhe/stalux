import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { getSiteData } from "../utils/config-utils";
import { toTimestamp } from "../utils/dayjs";
import { createTranslator } from "../utils/i18n";
import type { SearchDocument } from "../utils/orama-search";
import { toRoutePath } from "../utils/public-routes";
import { toMachineDateTime } from "../utils/semantic-time";
import { sitePath } from "../utils/site-path";
import { createOramaIndex, searchablePostBody } from "./orama-search-index";

declare const __STALUX_SEARCH_CJK__: boolean;

export const prerender = true;

export const GET: APIRoute = async () => {
    const [posts, config, aboutPages, words] = await Promise.all([
        getCollection("posts", ({ data }) => !data.draft),
        getCollection("config"),
        getCollection("about"),
        getCollection("words", ({ data }) => !data.draft),
    ]);
    const { lang, timezone } = getSiteData(config);
    const locale = lang || "zh-CN";
    const language = locale.toLowerCase();
    const documents: SearchDocument[] = posts.map(({ data, rendered, body }) => {
        const post = String(data.abbrlink);
        return {
            url: sitePath(toRoutePath(`/posts/${post}`)),
            post,
            language,
            title: data.title,
            description: data.desc ?? "",
            keywords: [
                ...(data.tags ?? []),
                ...(data.categories ?? []),
                ...(data.searchKeywords ?? []),
            ].join(" "),
            content: searchablePostBody(rendered?.html, body),
            published: toTimestamp(data.date, timezone),
            publishedDate: toMachineDateTime(data.date, timezone),
            category: data.categories?.[0] ?? "",
            tags: data.tags ?? [],
        };
    });
    const pageDefaults = {
        post: "",
        language,
        keywords: "",
        published: Number.MIN_SAFE_INTEGER,
    };
    const about = aboutPages[0];
    if (about) {
        documents.push({
            ...pageDefaults,
            url: sitePath(toRoutePath("/about")),
            title: about.data.title,
            description: about.data.description,
            content: searchablePostBody(about.rendered?.html, about.body),
        });
    }
    if (words.length) {
        const { t } = createTranslator(locale);
        documents.push({
            ...pageDefaults,
            url: sitePath(toRoutePath("/words")),
            title: t("words.title"),
            description: t("words.description"),
            content: words
                .map(({ rendered, body }) => searchablePostBody(rendered?.html, body))
                .join(" "),
        });
    }
    return new Response(await createOramaIndex(documents, __STALUX_SEARCH_CJK__), {
        headers: {
            "Content-Type": "application/octet-stream",
            ...(import.meta.env.DEV ? { "Cache-Control": "no-store" } : {}),
        },
    });
};
