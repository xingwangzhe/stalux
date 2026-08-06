import { readFile } from "node:fs/promises";
import path from "node:path";

import { isMarkdownExportEnabled, loadConfig, type ConfigMap } from "@utils/ai-discovery";
import { buildCCName, buildCCLink } from "@utils/cc";
import { createTranslator } from "@utils/i18n";
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";

export const prerender = true;

function reconstructMarkdown(post: CollectionEntry<"posts">): string {
    const d = post.data;
    const lines: string[] = ["---"];

    lines.push(`title: ${yamlScalar(d.title)}`);
    if (d.tags?.length)
        lines.push(`tags:\n${d.tags.map((t) => `    - ${yamlScalar(t)}`).join("\n")}`);
    if (d.categories?.length)
        lines.push(`categories:\n${d.categories.map((c) => `    - ${yamlScalar(c)}`).join("\n")}`);
    lines.push(`date: ${yamlScalar(d.date)}`);
    if (d.updated) lines.push(`updated: ${yamlScalar(d.updated)}`);
    lines.push(`desc: ${yamlScalar(d.desc)}`);
    lines.push(`abbrlink: ${yamlScalar(String(d.abbrlink))}`);
    if (d.draft) lines.push(`draft: true`);
    if (d.cc && d.cc !== "CC-BY-NC-SA-4.0") lines.push(`cc: ${yamlScalar(d.cc)}`);
    if (d.cover) lines.push(`cover: ${yamlScalar(d.cover)}`);

    lines.push("---", "");
    const body = typeof post.body === "string" ? post.body : "";
    return lines.join("\n") + body + (body.endsWith("\n") ? "" : "\n");
}

function yamlScalar(value: string): string {
    if (
        value === "" ||
        /[:#{}[\],&*?|>!%@`]/.test(value) ||
        value.includes("\n") ||
        value.startsWith(" ") ||
        value.endsWith(" ") ||
        value === "true" ||
        value === "false" ||
        value === "null"
    ) {
        return JSON.stringify(value);
    }
    return value;
}

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
        cacheKey: post.data.updated ?? post.data.date,
        props: { post },
    }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
    const config = await loadConfig();
    if (!isMarkdownExportEnabled(config)) return new Response(null, { status: 404 });

    const { post } = props as { post: CollectionEntry<"posts"> };

    let markdown: string;
    if (post.filePath) {
        const abs = path.resolve(process.cwd(), post.filePath);
        markdown = await readFile(abs, "utf-8");
    } else {
        markdown = reconstructMarkdown(post);
    }

    // 追加版权脚注（不修改原始 md 文件）
    const footer = generateCCFooter(post, config);
    markdown += "\n\n---\n\n" + footer;

    return new Response(markdown, {
        status: 200,
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
        },
    });
};
