/**
 * AI 发现文件（llms.txt / llms-full.txt）生成工具
 *
 * 为 /llms.txt、/llms-full.txt 以及所有页面 .md 导出提供共享数据与格式化函数。
 */
import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

import { toTimestamp } from "./dayjs";
import { createTranslator } from "./i18n";

export type ConfigMap = Map<string, Record<string, unknown>>;
export type Post = CollectionEntry<"posts">;
type About = CollectionEntry<"about">;

// ---------------------------------------------------------------------------
// AI 发现文件配置
// ---------------------------------------------------------------------------

export type AiFileName = "llms.txt" | "llms-full.txt";

const conformanceFiles: Record<string, AiFileName[]> = {
    disabled: [],
    essential: ["llms.txt", "llms-full.txt"],
    recommended: ["llms.txt", "llms-full.txt"],
    complete: ["llms.txt", "llms-full.txt"],
};

/** 根据 conformance 等级判断指定 AI 文件是否应生成 */
export function isAiFileEnabled(conformance: string | undefined, file: AiFileName): boolean {
    const files = conformanceFiles[conformance ?? "essential"];
    if (!files) return true; // unknown conformance → default to enabled
    return files.includes(file);
}

/** Markdown 导出仅在 promote.export_md 严格为 true 时启用 */
export function isMarkdownExportEnabled(config: ConfigMap): boolean {
    return config.get("promote")?.export_md === true;
}

/** 加载 config 集合，返回按 id 索引的 Map */
export async function loadConfig(): Promise<ConfigMap> {
    const configCollection = await getCollection("config");
    return new Map(configCollection.map((entry) => [entry.id, entry.data]));
}

/** 快捷获取 site 对象 */
function getSiteConfig(config: ConfigMap): Record<string, unknown> {
    return config.get("site") ?? {};
}

/**
 * 解析站点根 URL。
 *
 * 唯一真源是 stalux/config/site.yml 的 url；context.site（astro.config.mjs 的 site）
 * 仅作为 site.yml 缺失时的兜底，避免 llms.txt / *.md 导出与 sitemap / canonical 输出不一致。
 */
export function getSite(config: ConfigMap, contextSite?: string): string {
    const siteData = getSiteConfig(config);
    const configUrl = siteData.url as string | undefined;
    return (configUrl || contextSite || "").replace(/\/$/, "");
}

/** 将任意空白压缩为单行 */
function inlineText(text: string | undefined): string {
    return (text || "").replace(/\s+/g, " ").trim();
}

/** 转义 markdown 文本中的特殊字符（用于描述） */
function escapeMd(text: string | undefined): string {
    return inlineText(text).replace(/([\\[*_`#])/g, "\\$1");
}

/** 转义 markdown 链接标题中的特殊字符 */
function escapeMdLinkTitle(text: string | undefined): string {
    return inlineText(text).replace(/([\\[\]])/g, "\\$1");
}

/** 构建 markdown 列表项 */
function buildMdLink(title: string, url: string, desc?: string): string {
    const line = `- [${escapeMdLinkTitle(title)}](${url})`;
    return desc ? `${line}: ${escapeMd(desc)}` : line;
}

/** 生成页面链接，支持 HTML 或 .md 版本 */
function pageUrl(site: string, path: string, exportMd: boolean): string {
    return exportMd ? `${site}/${path}.md` : `${site}/${path}/`;
}

/** 生成文章链接，可切换 .md 源码版本 */
export function postUrl(site: string, abbrlink: string | number, exportMd: boolean): string {
    return exportMd && abbrlink ? `${site}/posts/${abbrlink}.md` : `${site}/posts/${abbrlink}/`;
}

/** 获取已发布文章并按日期降序排列 */
export async function getPublishedPosts(): Promise<Post[]> {
    const posts = await getCollection("posts", ({ data }) => !data.draft);
    return posts.sort((a, b) => {
        const aTime = toTimestamp(a.data.date || 0);
        const bTime = toTimestamp(b.data.date || 0);
        return bTime - aTime; // newest first
    });
}

/** 获取 about 页面 */
async function loadAbout(): Promise<About | undefined> {
    const aboutPages = await getCollection("about");
    return aboutPages[0];
}

/** 从 media-links section 中解析社交媒体链接 */
function getMediaLinks(config: ConfigMap): Array<{ name: string; url: string }> {
    const mediaSection = config.get("media-links");
    if (!mediaSection) return [];
    const items = (mediaSection as Record<string, unknown>).items as
        | Array<{ icon: string; link: string }>
        | undefined;
    if (!items) return [];
    return items
        .filter((link) => link.link && !link.link.startsWith("mailto:"))
        .map((link) => {
            const url = link.link || "";
            let name = "Link";
            try {
                const hostname = new URL(url.startsWith("http") ? url : `https://example.com${url}`)
                    .hostname;
                const domain = hostname.replace(/^www\./, "").split(".")[0];
                name = domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : "Link";
            } catch {
                // 无法解析 URL 时保持默认
            }
            return { name, url };
        });
}

/** 尝试从 media-links 中找出邮箱地址 */
function getEmail(config: ConfigMap): string | undefined {
    const mediaSection = config.get("media-links");
    if (!mediaSection) return undefined;
    const items = (mediaSection as Record<string, unknown>).items as
        | Array<{ icon: string; link: string }>
        | undefined;
    if (!items) return undefined;
    const mail = items.find((l) => l.link?.startsWith("mailto:"))?.link;
    if (mail) return mail.replace(/^mailto:/, "");
    return undefined;
}

// ---------------------------------------------------------------------------
// 页面 Markdown 渲染函数（用于 .md 端点和 llms-full.txt）
// ---------------------------------------------------------------------------

/** 构建分类/标签名 → 文章列表的映射 */
export function buildTaxonomyMap(posts: Post[], key: "tags" | "categories"): Map<string, Post[]> {
    const map = new Map<string, Post[]>();
    for (const post of posts) {
        for (const name of (post.data[key] ?? []) as string[]) {
            if (!map.has(name)) map.set(name, []);
            map.get(name)!.push(post);
        }
    }
    return map;
}

/** 渲染文章列表 Markdown */
export function renderPostListMd(
    posts: Post[],
    site: string,
    exportMd: boolean,
    title?: string,
): string {
    const lines: string[] = [];
    if (title) {
        lines.push(`## ${title}`);
        lines.push("");
    }
    if (posts.length === 0) {
        lines.push("- No posts");
    } else {
        for (const post of posts) {
            const postTitle = post.data.title || "Untitled";
            const url = postUrl(site, post.data.abbrlink, exportMd);
            const desc = post.data.desc || "";
            lines.push(buildMdLink(postTitle, url, desc));
        }
    }
    lines.push("");
    return lines.join("\n");
}

/** 渲染分类/标签索引列表 Markdown */
export function renderTaxonomyListMd(
    map: Map<string, Post[]>,
    site: string,
    type: "categories" | "tags",
    title?: string,
): string {
    const lines: string[] = [];
    if (title) {
        lines.push(`# ${title}`);
        lines.push("");
    }
    lines.push(`URL: ${site}/${type}/`);
    lines.push("");
    const sorted = [...map].sort((a, b) => b[1].length - a[1].length);
    for (const [name, posts] of sorted) {
        const slug = encodeURIComponent(name);
        const url = `${site}/${type}/${slug}/`;
        lines.push(buildMdLink(name, url, `${posts.length} posts`));
    }
    lines.push("");
    return lines.join("\n").trimEnd() + "\n";
}

/** 渲染单个分类/标签页 Markdown */
export function renderTaxonomyPageMd(
    name: string,
    posts: Post[],
    site: string,
    type: "categories" | "tags",
    exportMd: boolean,
): string {
    const label = type === "categories" ? "Category" : "Tag";
    const slug = encodeURIComponent(name);
    const pageUrl = `${site}/${type}/${slug}/`;
    const lines: string[] = [];
    lines.push(`# ${label}: ${name}`);
    lines.push("");
    lines.push(`URL: ${pageUrl}`);
    lines.push("");
    lines.push(renderPostListMd(posts, site, exportMd, `${posts.length} posts`));
    return lines.join("\n").trimEnd() + "\n";
}

/** 渲染 About 页 Markdown */
export async function renderAboutMd(site: string): Promise<string> {
    const aboutPages = await getCollection("about");
    const about = aboutPages[0];
    if (!about) return "";
    const lines: string[] = [];
    lines.push(`# ${about.data.title || "About"}`);
    lines.push("");
    lines.push(`URL: ${site}/about/`);
    lines.push("");
    lines.push((about.body as string) || "");
    lines.push("");
    return lines.join("\n").trimEnd() + "\n";
}

/** 渲染 Words 页 Markdown */
export async function renderWordsMd(): Promise<string> {
    const words = await getCollection("words", ({ data }) => !data.draft);
    words.sort((a, b) => toTimestamp(b.data.date || 0) - toTimestamp(a.data.date || 0));
    const lines: string[] = [];
    lines.push("# Words");
    lines.push("");
    lines.push("URL: /words/");
    lines.push("");
    for (const word of words) {
        const title = word.data.title || "Untitled";
        lines.push(`## ${title}`);
        lines.push((word.body as string) || "");
        lines.push("");
    }
    return lines.join("\n").trimEnd() + "\n";
}

/** 渲染 Links 页 Markdown */
export function renderLinksMd(config: ConfigMap, site: string, t: (key: string) => string): string {
    const linksSection = config.get("links") as Record<string, unknown> | undefined;
    const lines: string[] = [];
    lines.push(`# ${(linksSection?.title as string) || t("ai.links")}`);
    lines.push("");
    lines.push(`URL: ${site}/links/`);
    lines.push("");
    if (linksSection?.sites) {
        const sites = linksSection.sites as Array<{
            name: string;
            link: string;
            description: string;
        }>;
        for (const s of sites) {
            lines.push(buildMdLink(s.name, s.link, s.description));
        }
    }
    lines.push("");
    return lines.join("\n").trimEnd() + "\n";
}

/** 渲染 Archives 页 Markdown */
export async function renderArchivesMd(
    site: string,
    exportMd: boolean,
    t: (key: string) => string,
): Promise<string> {
    const posts = await getPublishedPosts();
    const lines: string[] = [];
    lines.push(`# ${t("archives.title")}`);
    lines.push("");
    lines.push(`URL: ${site}/archives/`);
    lines.push("");
    lines.push(renderPostListMd(posts, site, exportMd));
    return lines.join("\n").trimEnd() + "\n";
}

/** 渲染首页 Markdown */
export async function renderIndexMd(
    config: ConfigMap,
    site: string,
    t: (key: string) => string,
): Promise<string> {
    const posts = await getPublishedPosts();
    const siteData = getSiteConfig(config);
    const lang = (siteData.lang as string) || "zh-CN";
    const about = await loadAbout();
    const lines: string[] = [];

    lines.push(`# ${(siteData.title as string) || t("ai.blog")}`);
    lines.push("");
    lines.push(`URL: ${site}/`);
    lines.push("");
    lines.push(`> ${escapeMd(siteData.description as string)}`);
    lines.push("");
    lines.push(`Lang: ${lang}`);
    lines.push("");

    lines.push(`## ${t("ai.markdownSources")}`);
    lines.push(buildMdLink("Home", `${site}/index.md`));
    lines.push(buildMdLink("About", `${site}/about.md`));
    lines.push(buildMdLink("Words", `${site}/words.md`));
    lines.push(buildMdLink("Links", `${site}/links.md`));
    lines.push(buildMdLink("Archives", `${site}/archives.md`));
    lines.push(buildMdLink("Categories", `${site}/categories.md`));
    lines.push(buildMdLink("Tags", `${site}/tags.md`));
    lines.push(buildMdLink("LLMs.txt", `${site}/llms.txt`));
    lines.push(buildMdLink("LLMs-full.txt", `${site}/llms-full.txt`));
    lines.push("");

    if (about) {
        lines.push(`## ${t("ai.about")}`);
        lines.push((about.body as string) || "");
        lines.push("");
    }

    lines.push(`## ${t("ai.latestPosts")}`);
    lines.push(renderPostListMd(posts.slice(0, 10), site, true));
    return lines.join("\n").trimEnd() + "\n";
}

// ---------------------------------------------------------------------------
// llms.txt / llms-full.txt 渲染
// ---------------------------------------------------------------------------

/** 生成 llms.txt 核心 markdown 内容 */
export async function renderLlmsTxt(config: ConfigMap, site: string): Promise<string> {
    const posts = await getPublishedPosts();
    const about = await loadAbout();
    const siteData = getSiteConfig(config);
    const authorSection = config.get("author") as Record<string, unknown> | undefined;
    const linksSection = config.get("links") as Record<string, unknown> | undefined;
    const mediaLinks = getMediaLinks(config);
    const email = getEmail(config);
    const lang = (siteData.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const exportMd = isMarkdownExportEnabled(config);

    const lines: string[] = [];

    // Lang 头部
    lines.push(`Lang: ${lang}`);
    lines.push("");

    // H1 与 blockquote
    lines.push(`# ${(siteData.title as string) || t("ai.blog")}`);
    lines.push("");
    lines.push(`> ${escapeMd(siteData.description as string)}`);
    lines.push("");
    lines.push(`> ${t("ai.siteLicense")}`);
    lines.push("");

    // 简介段落
    const authorName = authorSection?.name as string | undefined;
    const authorBio = authorSection?.bio as string | undefined;
    if (authorName) {
        lines.push(`${t("ai.author")}${authorName}`);
        if (authorBio) lines.push(inlineText(authorBio));
        lines.push("");
    } else if (authorBio) {
        lines.push(inlineText(authorBio));
        lines.push("");
    }

    // Contact
    lines.push(`## ${t("ai.contact")}`);
    if (authorName) {
        lines.push(`- ${t("ai.author")}: ${escapeMd(authorName)}`);
    }
    if (email) {
        lines.push(`- ${t("ai.email")}: ${email}`);
    }
    for (const { name, url } of mediaLinks) {
        lines.push(`- ${t("ai.socialMedia")} (${escapeMd(name)}): ${url}`);
    }
    if (!authorName && !email && mediaLinks.length === 0) {
        lines.push(`- ${t("ai.noContact")}`);
    }
    lines.push("");

    // Posts
    lines.push(`## ${t("ai.posts")}`);
    if (posts.length === 0) {
        lines.push(`- ${t("ai.noPosts")}`);
    } else {
        for (const post of posts) {
            const title = post.data.title || t("ai.untitled");
            const url = postUrl(site, post.data.abbrlink, exportMd);
            const desc = post.data.desc || "";
            lines.push(buildMdLink(title, url, desc));
        }
    }
    lines.push("");

    // Pages
    lines.push(`## ${t("ai.pages")}`);
    if (about) {
        lines.push(
            buildMdLink(
                about.data.title || t("ai.about"),
                pageUrl(site, "about", exportMd),
                about.data.description || t("ai.aboutDesc"),
            ),
        );
    }
    lines.push(
        buildMdLink(t("ai.archives"), pageUrl(site, "archives", exportMd), t("ai.archivesDesc")),
    );
    lines.push(buildMdLink(t("ai.tags"), pageUrl(site, "tags", exportMd), t("ai.tagsDesc")));
    lines.push(
        buildMdLink(
            t("ai.categories"),
            pageUrl(site, "categories", exportMd),
            t("ai.categoriesDesc"),
        ),
    );
    lines.push(buildMdLink(t("ai.words"), pageUrl(site, "words", exportMd), t("ai.wordsDesc")));
    lines.push(buildMdLink(t("ai.links"), pageUrl(site, "links", exportMd), t("ai.links")));
    lines.push("");

    // Links（友情链接）
    if (linksSection?.sites) {
        const sites = linksSection.sites as Array<{
            name: string;
            link: string;
            description: string;
        }>;
        if (sites.length > 0) {
            lines.push(`## ${(linksSection.title as string) || t("ai.links")}`);
            for (const siteLink of sites) {
                lines.push(buildMdLink(siteLink.name, siteLink.link, siteLink.description));
            }
            lines.push("");
        }
    }

    // AI Discovery Files
    lines.push(`## ${t("ai.aiDiscoveryFiles")}`);
    lines.push(buildMdLink("llms.txt", `${site}/llms.txt`, t("ai.llmsTxtDesc")));
    lines.push(buildMdLink("llms-full.txt", `${site}/llms-full.txt`, t("ai.llmsFullTxtDesc")));
    lines.push("");

    // Developer resources and agent guidance. Keep these links predictable so an
    // agent can discover the read API without scraping the HTML application shell.
    lines.push("## Developer resources");
    lines.push(
        buildMdLink(
            "OpenAPI specification",
            `${site}/openapi.json`,
            "Machine-readable description of the read-only blog API.",
        ),
    );
    lines.push(
        buildMdLink(
            "Published post index",
            `${site}/api/posts.json`,
            "JSON metadata for published posts, including stable abbrlink identifiers.",
        ),
    );
    lines.push(
        buildMdLink(
            "Post identifier index",
            `${site}/api/post.abbrlink.json`,
            "JSON mapping of published post titles to stable identifiers.",
        ),
    );
    lines.push("");

    lines.push("## When to use this site");
    lines.push(
        "Use the read API or Markdown endpoints when you need to search, cite, summarize, or retrieve the author's published technical articles. Start with `/openapi.json` or `/api/posts.json`, then fetch a specific `/posts/{abbrlink}.md` resource. The endpoints are read-only and do not require authentication.",
    );
    lines.push("");

    // Optional
    lines.push(`## ${t("ai.optional")}`);
    lines.push(buildMdLink(t("ai.rss"), `${site}/rss.xml`));
    lines.push(buildMdLink(t("ai.atom"), `${site}/atom.xml`));
    if (exportMd) {
        lines.push(`- ${t("ai.mdAvailable")}`);
    }
    lines.push("");

    return lines.join("\n").trimEnd() + "\n";
}

/** 生成 llms-full.txt 内容：全站 Markdown 镜像 */
export async function renderLlmsFullTxt(config: ConfigMap, site: string): Promise<string> {
    const siteData = getSiteConfig(config);
    const lang = (siteData.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const posts = await getPublishedPosts();
    const categoryMap = buildTaxonomyMap(posts, "categories");
    const tagMap = buildTaxonomyMap(posts, "tags");
    const exportMd = isMarkdownExportEnabled(config);

    const sections: string[] = [];

    sections.push(`Lang: ${lang}`);
    sections.push("");
    sections.push(`# ${t("ai.fullDataset")}`);
    sections.push("");
    sections.push(`> ${t("ai.fullDatasetDesc")}`);
    sections.push("");
    sections.push(`- ${t("ai.license")}: CC-BY-NC-SA-4.0`);
    sections.push(`- ${t("ai.postCount")}: ${posts.length}`);
    sections.push("");

    sections.push("---");
    sections.push("");
    sections.push(await renderIndexMd(config, site, t));
    sections.push("---");
    sections.push("");
    sections.push(await renderAboutMd(site));
    sections.push("---");
    sections.push("");
    sections.push(await renderWordsMd());
    sections.push("---");
    sections.push("");
    sections.push(renderLinksMd(config, site, t));
    sections.push("---");
    sections.push("");
    sections.push(await renderArchivesMd(site, exportMd, t));
    sections.push("---");
    sections.push("");
    sections.push(renderTaxonomyListMd(categoryMap, site, "categories", t("ai.allCategories")));
    sections.push("---");
    sections.push("");
    for (const [name, catPosts] of [...categoryMap].sort((a, b) => b[1].length - a[1].length)) {
        sections.push(renderTaxonomyPageMd(name, catPosts, site, "categories", exportMd));
        sections.push("---");
        sections.push("");
    }
    sections.push(renderTaxonomyListMd(tagMap, site, "tags", t("ai.allTags")));
    sections.push("---");
    sections.push("");
    for (const [name, tagPosts] of [...tagMap].sort((a, b) => b[1].length - a[1].length)) {
        sections.push(renderTaxonomyPageMd(name, tagPosts, site, "tags", exportMd));
        sections.push("---");
        sections.push("");
    }
    for (const post of posts) {
        const title = post.data.title || t("ai.untitled");
        const url = postUrl(site, post.data.abbrlink, false);
        const cc = post.data.cc || "CC-BY-NC-SA-4.0";
        sections.push(`## ${escapeMd(title)}`);
        sections.push(`URL: ${url}`);
        sections.push(`License: ${cc}`);
        sections.push("");
        sections.push((post.body as string) || "");
        sections.push("");
        sections.push("---");
        sections.push("");
    }

    return sections.join("\n").trimEnd() + "\n";
}
