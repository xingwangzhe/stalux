import { type CollectionEntry, getCollection } from "astro:content";
import { getRuntimeCacheKey } from "@internal/runtime-cache-key";
import { type ConfigMap, isMarkdownExportEnabled, loadConfig } from "@utils/ai-discovery";
import { buildCCLink, buildCCName } from "@utils/cc";
import { createTranslator } from "@utils/i18n";
import { reconstructMarkdown } from "@utils/post-markdown";
import type { APIRoute, GetStaticPaths } from "astro";

export const prerender = true;

/** 生成 Markdown 格式的版权脚注 */
function generateCCFooter(post: CollectionEntry<"posts">, config: ConfigMap): string {
    const siteConfig = config.get("site") ?? {};
    const lang = (siteConfig.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const cc = (post.data.cc as string) || "CC-BY-NC-SA-4.0";
    const baseUrl = (siteConfig.url as string) || "";
    const author = (config.get("author")?.name as string) || "";
    const postUrl = baseUrl
        ? `${baseUrl}/posts/${post.data.abbrlink}/`
        : `/posts/${post.data.abbrlink}/`;

    const lines: string[] = [];
    lines.push(`**${t("post.author")}**${author}`);
    lines.push(`**${t("post.articleLink")}**[${postUrl}](${postUrl})`);
    lines.push(
        `${t("post.licensedUnder")}[${buildCCName(cc, t)}](${buildCCLink(cc)})${t("post.licenseSuffix")}`,
    );

    return lines.join("\n\n");
}

export const getStaticPaths = (async () => {
    const config = await loadConfig();
    if (!isMarkdownExportEnabled(config)) {
        return [];
    }

    const posts = await getCollection("posts", ({ data }) => !data.draft);
    return posts.map((post) => ({
        params: { post: String(post.data.abbrlink) },
        cacheKey: `${post.data.updated ?? post.data.date}|${getRuntimeCacheKey()}`,
        props: { post },
    }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
    const config = await loadConfig();
    if (!isMarkdownExportEnabled(config)) return new Response(null, { status: 404 });

    const { post } = props as { post: CollectionEntry<"posts"> };

    // 内容集合已经提供解析后的 frontmatter 和正文，导出一份内容等价的 Markdown。
    // 不读取 post.filePath，避免把页面端点绑定到 Node 文件系统。
    let markdown = reconstructMarkdown(post.data, post.body);

    // 追加版权脚注（不修改内容源文件）
    const footer = generateCCFooter(post, config);
    markdown += `\n\n---\n\n${footer}`;

    return new Response(markdown, {
        status: 200,
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            Vary: "Accept, Accept-Encoding",
        },
    });
};
