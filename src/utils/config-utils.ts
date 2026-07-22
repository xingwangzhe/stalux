import type {
    AuthorData,
    AiDiscoveryData,
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
/**
 * 类型安全的 Config 访问工具
 *
 * 利用 discriminated union + for/if 窄化，零 as/any/unknown 类型垃圾。
 *
 * 每个函数单独写 for + if (entry.id === 具体字面量)，
 * TS 在此条件分支中自动收窄 entry.data 为对应类型。
 */
import type { CollectionEntry } from "astro:content";

// ===================================================================
// Config 集合 (stalux/config/*.yml)
// ===================================================================

export function getSiteData(entries: CollectionEntry<"config">[]): SiteData {
    for (const entry of entries) {
        if (entry.id === "site") return entry.data;
    }
    throw new Error("Missing site config");
}

export function getAuthorData(entries: CollectionEntry<"config">[]): AuthorData {
    for (const entry of entries) {
        if (entry.id === "author") return entry.data;
    }
    throw new Error("Missing author config");
}

export function getHeadData(entries: CollectionEntry<"config">[]): HeadData | undefined {
    for (const entry of entries) {
        if (entry.id === "head") return entry.data;
    }
    return undefined;
}

export function getNavsData(entries: CollectionEntry<"config">[]): NavsData | undefined {
    for (const entry of entries) {
        if (entry.id === "navs") return entry.data;
    }
    return undefined;
}

export function getTypetextsData(entries: CollectionEntry<"config">[]): TypetextsData | undefined {
    for (const entry of entries) {
        if (entry.id === "typetexts") return entry.data;
    }
    return undefined;
}

export function getMediaLinksData(
    entries: CollectionEntry<"config">[],
): MediaLinksData | undefined {
    for (const entry of entries) {
        if (entry.id === "media-links") return entry.data;
    }
    return undefined;
}

export function getLinksData(entries: CollectionEntry<"config">[]): LinksData | undefined {
    for (const entry of entries) {
        if (entry.id === "links") return entry.data;
    }
    return undefined;
}

export function getFooterData(entries: CollectionEntry<"config">[]): FooterData | undefined {
    for (const entry of entries) {
        if (entry.id === "footer") return entry.data;
    }
    return undefined;
}

export function getCommentData(entries: CollectionEntry<"config">[]): CommentData | undefined {
    for (const entry of entries) {
        if (entry.id === "comment") return entry.data;
    }
    return undefined;
}

export function getPromoteData(entries: CollectionEntry<"config">[]): PromoteData | undefined {
    for (const entry of entries) {
        if (entry.id === "promote") return entry.data;
    }
    return undefined;
}

export function getAiDiscoveryData(
    entries: CollectionEntry<"config">[],
): AiDiscoveryData | undefined {
    for (const entry of entries) {
        if (entry.id === "ai-discovery") return entry.data;
    }
    return undefined;
}
