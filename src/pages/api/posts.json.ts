import { getCollection } from "astro:content";
import { getSiteData } from "@utils/config-utils";
import { getPostContentIndex } from "@utils/content-index";
import { toMachineDateTime } from "@utils/semantic-time";
import { sitePath } from "@utils/site-path";
import { getPostDescriptions } from "@utils/word-count-utils";
import type { APIRoute } from "astro";

export const prerender = true;

/**
 * 文章元信息索引（供 WebMCP 工具与外部消费）
 *
 * 相比 /api/post.abbrlink.json，包含完整元信息（日期/分类/标签/摘要/字数），
 * 是 stalux_get_post / stalux_random_post 等 WebMCP 工具的廉价数据源。
 */
export const GET: APIRoute = async ({ logger }) => {
    const { posts } = await getPostContentIndex();

    const descriptions = await getPostDescriptions(logger);
    // 面向机器的端点必须输出带时区偏移的 ISO 时间；裸 frontmatter 串会被消费方按本地时区解释
    const timezone = getSiteData(await getCollection("config")).timezone || "Asia/Shanghai";
    const payload = posts.map((post) => ({
        title: post.data.title,
        abbrlink: String(post.data.abbrlink),
        date: post.data.date ? toMachineDateTime(post.data.date, timezone) : undefined,
        updated: post.data.updated ? toMachineDateTime(post.data.updated, timezone) : undefined,
        tags: post.data.tags ?? [],
        categories: post.data.categories ?? [],
        desc: post.data.desc ?? "",
        wordCount: descriptions.get(String(post.data.abbrlink))?.wordCount ?? 0,
        url: sitePath(`posts/${encodeURIComponent(String(post.data.abbrlink))}/`),
    }));

    return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=0, must-revalidate",
        },
    });
};
