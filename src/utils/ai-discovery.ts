/**
 * AI 发现文件（llms.txt / llms-full.txt）生成工具
 *
 * 为 /llms.txt、/llms-full.txt 提供共享数据与格式化函数。
 */
import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

import { toTimestamp } from "./dayjs";
import { createTranslator } from "./i18n";

export type ConfigMap = Map<string, Record<string, unknown>>;
type Post = CollectionEntry<"posts">;
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

/** 加载 config 集合，返回按 id 索引的 Map */
export async function loadConfig(): Promise<ConfigMap> {
    const configCollection = await getCollection("config");
    return new Map(configCollection.map((entry) => [entry.id, entry.data]));
}

/** 快捷获取 site 对象 */
function getSiteConfig(config: ConfigMap): Record<string, unknown> {
    return config.get("site") ?? {};
}

/** 解析站点根 URL */
export function getSite(config: ConfigMap, contextSite?: string): string {
    const siteData = getSiteConfig(config);
    return (contextSite || (siteData.url as string) || "").replace(/\/$/, "");
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

/** 获取已发布文章并按日期降序排列 */
async function getPublishedPosts(): Promise<Post[]> {
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

/** 生成文章链接，可切换 .md 源码版本 */
function postUrl(site: string, abbrlink: string | number, exportMd: boolean): string {
    return exportMd && abbrlink ? `${site}/posts/${abbrlink}.md` : `${site}/posts/${abbrlink}/`;
}

/** 生成 llms.txt 核心 markdown 内容 */
export async function renderLlmsTxt(config: ConfigMap, site: string): Promise<string> {
    const posts = await getPublishedPosts();
    const about = await loadAbout();
    const siteData = getSiteConfig(config);
    const authorSection = config.get("author") as Record<string, unknown> | undefined;
    const linksSection = config.get("links") as Record<string, unknown> | undefined;
    const promoteSection = config.get("promote") as Record<string, unknown> | undefined;
    const mediaLinks = getMediaLinks(config);
    const email = getEmail(config);
    const lang = (siteData.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const exportMd = (promoteSection?.export_md as boolean) ?? false;

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
                `${site}/about/`,
                about.data.description || t("ai.aboutDesc"),
            ),
        );
    }
    lines.push(buildMdLink(t("ai.archives"), `${site}/archives/`, t("ai.archivesDesc")));
    lines.push(buildMdLink(t("ai.tags"), `${site}/tags/`, t("ai.tagsDesc")));
    lines.push(buildMdLink(t("ai.categories"), `${site}/categories/`, t("ai.categoriesDesc")));
    lines.push(buildMdLink(t("ai.words"), `${site}/words/`, t("ai.wordsDesc")));
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

/** 生成 llms-full.txt 内容：全部公开文章的 Markdown 全文 */
export async function renderLlmsFullTxt(config: ConfigMap, site: string): Promise<string> {
    const posts = await getPublishedPosts();
    const siteData = getSiteConfig(config);
    const lang = (siteData.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);

    const lines: string[] = [];

    lines.push(`Lang: ${lang}`);
    lines.push("");
    lines.push(`# ${t("ai.fullDataset")}`);
    lines.push("");
    lines.push(`> ${t("ai.fullDatasetDesc")}`);
    lines.push("");
    lines.push(`- ${t("ai.license")}: CC-BY-NC-SA-4.0`);
    lines.push(`- ${t("ai.postCount")}: ${posts.length}`);
    lines.push("");

    for (const post of posts) {
        const title = post.data.title || t("ai.untitled");
        const url = postUrl(site, post.data.abbrlink, false);
        const cc = post.data.cc || "CC-BY-NC-SA-4.0";
        lines.push(`## ${escapeMd(title)}`);
        lines.push(`URL: ${url}`);
        lines.push(`License: ${cc}`);
        lines.push("");
        lines.push((post.body as string) || "");
        lines.push("");
        lines.push("---");
        lines.push("");
    }

    return lines.join("\n").trimEnd() + "\n";
}
