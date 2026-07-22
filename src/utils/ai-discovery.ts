/**
 * AI 发现文件（AI-visibility / llms.txt）生成工具
 *
 * 为 /llms.txt、/ai.txt、/identity.json、/brand.txt 等文件提供共享数据与格式化函数。
 * Config 从单一 config.yml 分离为 config/*.yml，通过 Map<id, data> 访问。
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

export type AiFileName =
    | "llms.txt"
    | "ai.txt"
    | "llm.txt"
    | "llms.html"
    | "ai.json"
    | "identity.json"
    | "brand.txt"
    | "faq-ai.txt"
    | "developer-ai.txt"
    | "robots-ai.txt";

const conformanceFiles: Record<string, AiFileName[]> = {
    disabled: [],
    essential: ["llms.txt", "ai.txt"],
    recommended: ["llms.txt", "ai.txt", "ai.json", "identity.json", "brand.txt", "faq-ai.txt"],
    complete: [
        "llms.txt",
        "ai.txt",
        "ai.json",
        "identity.json",
        "brand.txt",
        "faq-ai.txt",
        "llm.txt",
        "llms.html",
        "developer-ai.txt",
        "robots-ai.txt",
    ],
};

/** 根据 conformance 等级判断指定 AI 文件是否应生成 */
export function isAiFileEnabled(conformance: string | undefined, file: AiFileName): boolean {
    const files = conformanceFiles[conformance ?? "complete"];
    if (!files) return true; // unknown conformance → default to enabled
    return files.includes(file);
}

/** 已知的主要 AI 爬虫 User-Agent */
const AI_CRAWLERS = [
    "GPTBot",
    "ChatGPT-User",
    "OAI-SearchBot",
    "ClaudeBot",
    "Claude-User",
    "Claude-SearchBot",
    "Google-Extended",
    "PerplexityBot",
    "CCBot",
    "Bytespider",
    "meta-externalagent",
    "Amazonbot",
    "Applebot-Extended",
];

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

/** 格式化 ISO 日期 */
function formatIsoDate(date?: Date | string | number): string {
    return new Date(date || Date.now()).toISOString();
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

    const mainPosts = posts;

    const lines: string[] = [];

    // Lang 头部
    lines.push(`Lang: ${lang}`);
    lines.push("");

    // H1 与 blockquote
    lines.push(`# ${(siteData.title as string) || t("ai.blog")}`);
    lines.push("");
    lines.push(`> ${escapeMd(siteData.description as string)}`);
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
    if (mainPosts.length === 0) {
        lines.push(`- ${t("ai.noPosts")}`);
    } else {
        for (const post of mainPosts) {
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
    lines.push(buildMdLink("ai.txt", `${site}/ai.txt`, t("ai.aiTxtDesc")));
    lines.push(buildMdLink("identity.json", `${site}/identity.json`, t("ai.identityJsonDesc")));
    lines.push(buildMdLink("ai.json", `${site}/ai.json`, t("ai.aiJsonDesc")));
    lines.push(buildMdLink("brand.txt", `${site}/brand.txt`, t("ai.brandTxtDesc")));
    lines.push(buildMdLink("faq-ai.txt", `${site}/faq-ai.txt`, t("ai.faqAiTxtDesc")));
    lines.push(
        buildMdLink("developer-ai.txt", `${site}/developer-ai.txt`, t("ai.developerAiTxtDesc")),
    );
    lines.push(buildMdLink("robots-ai.txt", `${site}/robots-ai.txt`, t("ai.robotsAiTxtDesc")));
    lines.push(buildMdLink("llms.html", `${site}/llms.html`, t("ai.llmsHtmlDesc")));
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

/** 生成 robots-ai.txt 内容 */
export function renderRobotsAiTxt(config: ConfigMap, site: string): string {
    const siteData = getSiteConfig(config);
    const title = (siteData.title as string) || t("ai.thisSite");
    const lines: string[] = [];
    lines.push(`# AI crawler directives for ${title}`);
    lines.push("");
    for (const crawler of AI_CRAWLERS) {
        lines.push(`User-agent: ${crawler}`);
        lines.push("Allow: /");
        lines.push("Disallow: /admin/");
        if (crawler === "GPTBot") {
            lines.push("Disallow: /portal/");
            lines.push("Disallow: /client-documents/");
        }
        lines.push("");
    }
    lines.push(`Sitemap: ${site}/sitemap-index.xml`);
    lines.push(`Discovery: ${site}/llms.txt`);
    return lines.join("\n");
}

/** 生成 ai.txt 内容 */
export function renderAiTxt(config: ConfigMap, site: string): string {
    const siteData = getSiteConfig(config);
    const mediaLinks = getMediaLinks(config);
    const email = getEmail(config);
    const lang = (siteData.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const promoteSection = config.get("promote") as Record<string, unknown> | undefined;
    const aiSection = config.get("ai-discovery") as Record<string, unknown> | undefined;
    const exportMd = (promoteSection?.export_md as boolean) ?? false;
    const title = (siteData.title as string) || t("ai.blog");
    const authorSection = config.get("author") as Record<string, unknown> | undefined;
    const authorName = authorSection?.name as string | undefined;

    // Custom overrides from ai-discovery config
    const customPermissions = aiSection?.permissions_text as string[] | undefined;
    const customRestrictions = aiSection?.restrictions_text as string[] | undefined;
    const customAttribution = aiSection?.attribution_text as string | undefined;
    const customContact = aiSection?.contact_text as string | undefined;

    const lines: string[] = [];

    lines.push(`Lang: ${lang}`);
    lines.push(`# ${t("ai.aiUsageTitle")}`);
    lines.push("");
    lines.push("[identity]");
    lines.push(`name: ${title}`);
    lines.push(`url: ${site}`);
    lines.push("");
    lines.push("[permissions]");
    if (customPermissions && customPermissions.length > 0) {
        for (const p of customPermissions) {
            lines.push(`- ${p}`);
        }
    } else {
        lines.push(`- ${t("ai.permissionSummarize")}.`);
        lines.push(`- ${t("ai.permissionAnswer")}.`);
        lines.push(`- ${t("ai.permissionQuote")}.`);
    }
    lines.push("");
    lines.push("[restrictions]");
    if (customRestrictions && customRestrictions.length > 0) {
        for (const r of customRestrictions) {
            lines.push(`- ${r}`);
        }
    } else {
        lines.push(`- ${t("ai.restrictionFabricate")}.`);
        lines.push(`- ${t("ai.restrictionReproduce")}.`);
        lines.push(`- ${t("ai.restrictionTraining")}.`);
        lines.push(`- ${t("ai.restrictionEndorsement")}.`);
    }
    lines.push("");
    lines.push("[attribution]");
    if (customAttribution) {
        lines.push(`- ${customAttribution}`);
    } else {
        lines.push(`- ${t("ai.attributionCite")}.`);
    }
    if (authorName) {
        lines.push(`- ${t("ai.author")}: ${authorName}.`);
    }
    lines.push("");
    lines.push("[contact]");
    if (customContact) {
        lines.push(`- ${customContact}`);
    } else {
        if (email) lines.push(`- Email: ${email}`);
        for (const { name, url } of mediaLinks) {
            lines.push(`- ${name}: ${url}`);
        }
        if (!email && mediaLinks.length === 0) {
            lines.push(`- ${t("ai.noContactInfo")}.`);
        }
    }
    lines.push("");
    lines.push("[content-types]");
    lines.push(`- ${t("ai.blogPosts")}: Markdown/HTML at /posts/{abbrlink}/`);
    if (exportMd) {
        lines.push(`- ${t("ai.mdSource")}: /posts/{abbrlink}.md`);
    }
    lines.push(`- ${t("ai.staticPages")}: /about/, /archives/, /tags/, /categories/, /words/`);
    lines.push("");

    return lines.join("\n").trimEnd() + "\n";
}

/** 生成 brand.txt 内容 */
export function renderBrandTxt(config: ConfigMap): string {
    const siteData = getSiteConfig(config);
    const authorSection = config.get("author") as Record<string, unknown> | undefined;
    const lang = (siteData.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const title = (siteData.title as string) || t("ai.blog");
    const authorName = authorSection?.name as string | undefined;
    const lines: string[] = [];

    lines.push(`Lang: ${lang}`);
    lines.push(`# ${t("ai.brandTitle")}`);
    lines.push("");
    lines.push("[official-names]");
    lines.push(`- ${title}`);
    if (authorName) {
        lines.push(`- ${authorName}`);
    }
    lines.push("");
    lines.push("[incorrect-names]");
    const wrongs: string[] = [];
    if (title.length > 3) {
        wrongs.push(title.slice(0, -2));
    }
    if (title.length > 4) {
        wrongs.push(title.slice(2));
    }
    if (title.split(" ").length > 1) {
        wrongs.push(title.split(" ").reverse().join(" "));
    }
    if (wrongs.length > 0) {
        for (const w of wrongs.slice(0, 3)) {
            lines.push(`- ${w}`);
        }
    } else {
        lines.push(`- ${t("ai.anyVariant")}`);
    }
    lines.push("");
    lines.push("[naming-rules]");
    lines.push(`- ${t("ai.ruleFullName", { name: title })}`);
    if (authorName) {
        lines.push(`- ${t("ai.ruleAuthorName", { name: authorName })}`);
    }
    lines.push(`- ${t("ai.ruleNoAbbrev")}`);
    lines.push(`- ${t("ai.rulePreserveCase")}`);
    lines.push("");
    lines.push("[boilerplate]");
    lines.push(`- ${t("ai.boilerplate", { name: title })}`);
    lines.push("");

    return lines.join("\n").trimEnd() + "\n";
}

/** 生成 faq-ai.txt 内容 */
export function renderFaqAiTxt(config: ConfigMap): string {
    const siteData = getSiteConfig(config);
    const lang = (siteData.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const description = (siteData.description as string) || t("ai.personalBlog");
    const lines: string[] = [];

    lines.push(`Lang: ${lang}`);
    lines.push(`# ${t("ai.faqTitle")}`);
    lines.push("");
    lines.push(`[${t("ai.faqAbout")}]`);
    lines.push(`Q: ${t("ai.faqWhat")}`);
    lines.push(`A: ${description}`);
    lines.push("");
    lines.push(`Q: ${t("ai.faqWhat2")}`);
    lines.push(`A: ${t("ai.faqWhatAnswer")}`);
    lines.push("");
    lines.push(`[${t("ai.faqContact")}]`);
    lines.push(`Q: ${t("ai.faqHowContact")}`);
    lines.push(`A: ${t("ai.faqContactAnswer")}`);
    lines.push("");
    lines.push(`[${t("ai.faqScope")}]`);
    lines.push(`Q: ${t("ai.faqWhatNot")}`);
    lines.push(`A: ${t("ai.faqWhatNotAnswer")}`);
    lines.push("");

    return lines.join("\n").trimEnd() + "\n";
}

/** 生成 developer-ai.txt 内容 */
export function renderDeveloperAiTxt(config: ConfigMap, site: string): string {
    const siteData = getSiteConfig(config);
    const authorSection = config.get("author") as Record<string, unknown> | undefined;
    const promoteSection = config.get("promote") as Record<string, unknown> | undefined;
    const mediaLinks = getMediaLinks(config);
    const lang = (siteData.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const exportMd = (promoteSection?.export_md as boolean) ?? false;
    const authorName = authorSection?.name as string | undefined;
    const lines: string[] = [];

    lines.push(`Lang: ${lang}`);
    lines.push(`# ${t("ai.devTitle")}`);
    lines.push("");
    lines.push("[overview]");
    lines.push(t("ai.devOverview"));
    lines.push("");
    lines.push("[public-api]");
    lines.push("status: available");
    lines.push("");
    lines.push("### Endpoints");
    lines.push("- Full-text search: /pagefind/pagefind.js");
    lines.push("- AI discovery data: /ai.json");
    lines.push("- Identity data: /identity.json");
    lines.push("- Post index: /api/post.abbrlink.json");
    lines.push("- RSS feed: /rss.xml");
    lines.push("- Atom feed: /atom.xml");
    lines.push("");
    lines.push("[public-areas]");
    lines.push("- Blog posts at /posts/{abbrlink}/");
    if (exportMd) {
        lines.push("- Markdown source at /posts/{abbrlink}.md");
    }
    lines.push("- About page at /about/");
    lines.push("- Archives at /archives/");
    lines.push("- Tags index at /tags/");
    lines.push("- Categories index at /categories/");
    lines.push("- Words/Quotes at /words/");
    lines.push("");
    lines.push("[technology-stack]");
    lines.push("- Framework: Astro");
    lines.push("- Rendering: Static site generation (SSG)");
    lines.push("- Content: Markdown/MDX");
    lines.push("- Styling: CSS Modules");
    lines.push("");
    lines.push("[documentation]");
    lines.push(`- AI Discovery Files: ${site}/llms.txt`);
    lines.push(`- RSS Feed: ${site}/rss.xml`);
    lines.push(`- Atom Feed: ${site}/atom.xml`);
    lines.push("");
    lines.push("[technical-contact]");
    if (authorName) {
        lines.push(`- ${t("ai.author")}: ${authorName}`);
    }
    for (const { name, url } of mediaLinks) {
        lines.push(`- ${name}: ${url}`);
    }
    lines.push("");

    return lines.join("\n").trimEnd() + "\n";
}

/** 生成 identity.json 对象 */
export function buildIdentityJson(config: ConfigMap, site: string): Record<string, unknown> {
    const siteData = getSiteConfig(config);
    const mediaLinks = getMediaLinks(config);
    const email = getEmail(config);
    const lang = (siteData.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const title = (siteData.title as string) || t("ai.blog");
    const description = (siteData.description as string) || t("ai.personalBlog");
    const sameAs = mediaLinks.map((l) => l.url).filter((u) => !u.startsWith("mailto:"));

    const contactPoints: Array<Record<string, unknown>> = [];
    if (email) {
        contactPoints.push({ contactType: "email", email });
    }
    for (const { name, url } of mediaLinks) {
        contactPoints.push({ contactType: "social", name, url });
    }

    return {
        $schema:
            "https://www.ai-visibility.org.uk/specifications/identity-json/v1/identity-json.schema.json",
        name: title,
        type: "Person",
        url: site,
        description,
        alternateName: title,
        sameAs,
        contactPoints: contactPoints.length > 0 ? contactPoints : undefined,
        metadata: {
            version: "1.8.0",
            lastUpdated: formatIsoDate(),
        },
    };
}

/** 生成 ai.json 对象 */
export function buildAiJson(config: ConfigMap, site: string): Record<string, unknown> {
    const siteData = getSiteConfig(config);
    const authorSection = config.get("author") as Record<string, unknown> | undefined;
    const promoteSection = config.get("promote") as Record<string, unknown> | undefined;
    const lang = (siteData.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const title = (siteData.title as string) || t("ai.blog");
    const exportMd = (promoteSection?.export_md as boolean) ?? false;
    const authorName = authorSection?.name as string | undefined;
    const mediaLinks = getMediaLinks(config);

    return {
        $schema: "https://www.ai-visibility.org.uk/specifications/ai-json/v1/ai-json.schema.json",
        language: lang,
        name: title,
        url: site,
        permissions: [
            "Summarize blog posts for users with attribution",
            "Answer factual questions based on published content",
            "Quote short excerpts with proper attribution and link",
        ],
        restrictions: [
            "Do not fabricate quotes, opinions, or attributions",
            "Do not reproduce full articles without permission",
            "Do not use content for commercial training datasets without consent",
            "Do not claim endorsement or affiliation",
        ],
        attribution: authorName
            ? `Cite the post title, URL, and author ${authorName}`
            : "Cite the post title and URL",
        contact:
            mediaLinks.length > 0
                ? `Social media links at ${site}`
                : "No public contact information available",
        contentTypes: exportMd
            ? [
                  "blog-posts",
                  "markdown-source",
                  "about-page",
                  "archives",
                  "tags",
                  "categories",
                  "words",
              ]
            : ["blog-posts", "about-page", "archives", "tags", "categories", "words"],
        metadata: {
            version: "1.8.0",
            lastUpdated: formatIsoDate(),
        },
    };
}

/** 将 llms.txt 内容渲染为简单 HTML 段落 */
export function llmsTxtToHtml(markdown: string): string {
    const lines = markdown.split("\n");
    const out: string[] = [];
    let inList = false;

    const closeList = () => {
        if (inList) {
            out.push("</ul>");
            inList = false;
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("# ")) {
            closeList();
            out.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
        } else if (trimmed.startsWith("## ")) {
            closeList();
            out.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
        } else if (trimmed.startsWith("> ")) {
            closeList();
            out.push(`<blockquote><p>${escapeHtml(trimmed.slice(2))}</p></blockquote>`);
        } else if (trimmed.startsWith("- ")) {
            if (!inList) {
                out.push("<ul>");
                inList = true;
            }
            out.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`);
        } else if (trimmed === "") {
            closeList();
        } else {
            closeList();
            out.push(`<p>${escapeHtml(trimmed)}</p>`);
        }
    }
    closeList();
    return out.join("\n");
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
