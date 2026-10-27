import { createHash } from "node:crypto";

export interface SocialCardData {
    title: string;
    description: string;
    siteTitle: string;
    author: string;
    host: string;
    lang: string;
    accent: string;
    date: string;
    category: string;
    cover?: string;
}

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

export function socialCardPath(data: SocialCardData, base = "/"): string {
    // Bump the template revision when layout changes. Metadata changes get a fresh URL.
    const hash = createHash("sha256")
        .update(JSON.stringify(["stalux-takumi-v2", data]))
        .digest("hex")
        .slice(0, 20);
    return `${base.replace(/\/$/u, "")}/og/${hash}.png`;
}

export function resolvePostSocialImage(
    explicit: string | undefined,
    data: SocialCardData,
    base = "/",
): SocialImage {
    if (explicit?.trim() && isSocialImageUrl(explicit.trim())) return { url: explicit.trim() };
    // PNG for the sharing image, always. Several platforms (and every legacy
    // crawler) refuse WebP or AVIF in og:image, so this is the one place the
    // modern format costs reach instead of saving bytes. In-page images are
    // served as WebP instead, where the browser decides.
    return {
        url: socialCardPath(data, base),
        width: 1200,
        height: 630,
        type: "image/png",
    };
}
