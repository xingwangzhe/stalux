export interface SocialImage {
    url: string;
    width?: number;
    height?: number;
    type?: string;
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
