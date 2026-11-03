import { createHash } from "node:crypto";
import { loadSharp } from "../internal/sharp-loader";

export interface SocialCardData {
    title: string;
    description: string;
    siteTitle: string;
    author: string;
    host: string;
    lang: string;
    date: string;
    category: string;
    cover?: string;
}

export type SocialCardFormat = "jpg" | "png";

export interface SocialImage {
    url: string;
    width?: number;
    height?: number;
    type?: string;
    fallbackUrl?: string;
}

/** Explicit sharing images accept web URLs and site-root paths, never executable schemes. */
export function isSocialImageUrl(value: string): boolean {
    if (!value.trim() || /\s/u.test(value)) return false;
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
        return (
            ["http:", "https:"].includes(new URL(value, "https://example.invalid").protocol) &&
            /^(?:https?:)?\/\//iu.test(value)
        );
    } catch {
        return false;
    }
}

/**
 * Cards with artwork are photographic, so JPEG saves most of the bytes and is
 * accepted by every crawler. Plain cards stay PNG: flat type compresses far
 * better there. Without `sharp` neither palette PNG nor JPEG is available, so
 * the card falls back to a plain PNG.
 */
export function socialCardFormat(data: Pick<SocialCardData, "cover">): SocialCardFormat {
    return data.cover && loadSharp() ? "jpg" : "png";
}

export function socialCardPath(data: SocialCardData, base = "/"): string {
    // Bump the template revision when layout changes. Metadata changes get a fresh URL.
    const hash = createHash("sha256")
        .update(JSON.stringify(["stalux-mono-v1", data]))
        .digest("hex")
        .slice(0, 20);
    return `${base.replace(/\/$/u, "")}/og/${hash}.${socialCardFormat(data)}`;
}

export function resolvePostSocialImage(
    explicit: string | undefined,
    data: SocialCardData,
    base = "/",
): SocialImage {
    if (explicit?.trim() && isSocialImageUrl(explicit.trim())) return { url: explicit.trim() };
    const format = socialCardFormat(data);
    return {
        url: socialCardPath(data, base),
        width: 1200,
        height: 630,
        type: format === "jpg" ? "image/jpeg" : "image/png",
    };
}
