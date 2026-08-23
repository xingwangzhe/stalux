/**
 * 类型安全的 Config 访问工具
 *
 * Astro loader 的 entry.id 是文件标识；真正的配置 discriminant 是 entry.data.id。
 * 这里是唯一的 collection adapter，页面只消费已经按 section 收窄的配置。
 */
import type { CollectionEntry } from "astro:content";
import type {
    AiDiscoveryData,
    AuthorData,
    CommentData,
    FooterData,
    HeadData,
    LinksData,
    MediaLinksData,
    NavsData,
    PromoteData,
    SiteData,
    TypetextsData,
} from "@schemas/config";

// ===================================================================
// Config 集合 (stalux/config/*.yml)
// ===================================================================

type ConfigEntry = CollectionEntry<"config">;
type ConfigData = ConfigEntry["data"];
type ConfigId = ConfigData["id"];
type ConfigById<Id extends ConfigId> = Extract<ConfigData, { id: Id }>;

function findConfig<Id extends ConfigId>(
    entries: ConfigEntry[],
    id: Id,
): ConfigById<Id> | undefined {
    const data = entries.find((entry) => entry.data.id === id)?.data;
    return data as ConfigById<Id> | undefined;
}

export function getSiteData(entries: CollectionEntry<"config">[]): SiteData {
    const site = findConfig(entries, "site");
    if (!site) throw new Error("Missing site config");
    return site;
}

export function getAuthorData(entries: CollectionEntry<"config">[]): AuthorData {
    const author = findConfig(entries, "author");
    if (!author) throw new Error("Missing author config");
    return author;
}

export function getHeadData(entries: CollectionEntry<"config">[]): HeadData | undefined {
    return findConfig(entries, "head");
}

export function getNavsData(entries: CollectionEntry<"config">[]): NavsData | undefined {
    return findConfig(entries, "navs");
}

export function getTypetextsData(entries: CollectionEntry<"config">[]): TypetextsData | undefined {
    return findConfig(entries, "typetexts");
}

export function getMediaLinksData(
    entries: CollectionEntry<"config">[],
): MediaLinksData | undefined {
    return findConfig(entries, "media-links");
}

export function getLinksData(entries: CollectionEntry<"config">[]): LinksData | undefined {
    return findConfig(entries, "links");
}

export function getFooterData(entries: CollectionEntry<"config">[]): FooterData | undefined {
    return findConfig(entries, "footer");
}

export function getCommentData(entries: CollectionEntry<"config">[]): CommentData | undefined {
    return findConfig(entries, "comment");
}

export function getPromoteData(entries: CollectionEntry<"config">[]): PromoteData | undefined {
    return findConfig(entries, "promote");
}

export function getAiDiscoveryData(
    entries: CollectionEntry<"config">[],
): AiDiscoveryData | undefined {
    return findConfig(entries, "ai-discovery");
}
