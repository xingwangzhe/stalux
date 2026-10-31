import { createHash } from "node:crypto";
import type { AstroRuntimeLogger } from "astro";
/**
 * 徽章生成器工具
 * 基于 badge-maker 库生成徽章
 */
import { makeBadge } from "badge-maker";
import { logFailure } from "./diagnostics";

export interface BadgeOptions {
    label: string;
    message: string;
    color?: string;
    style?: "plastic" | "flat" | "flat-square" | "for-the-badge" | "social";
    labelColor?: string;
    logo?: string;
    logoWidth?: number;
    alt?: string;
    href?: string;
    rel?: string;
}

export interface BadgeGroup {
    title: string;
    collapsed?: boolean;
    items: BadgeOptions[];
}

/** 单个 badge 或 badge 分组 */
export type BadgeItem = BadgeOptions | BadgeGroup;

/** 判断是否为 badge 分组 */
export function isBadgeGroup(item: BadgeItem): item is BadgeGroup {
    return "title" in item && "items" in item;
}

/**
 * 生成徽章SVG
 * @param options 徽章选项
 * @returns 返回徽章SVG字符串
 */
export function generateBadge(options: BadgeOptions, logger?: AstroRuntimeLogger): string {
    try {
        const format: Parameters<typeof makeBadge>[0] = {
            label: options.label,
            message: options.message,
            color: options.color ?? "blue",
            style: options.style ?? "flat",
            ...(options.labelColor ? { labelColor: options.labelColor } : {}),
            ...(options.logo ? { logoBase64: options.logo } : {}),
        };

        return makeBadge(format);
    } catch (error) {
        logFailure(logger, "badges", "generation failed", error);
        return "";
    }
}

/** Content-addressed assets are shared by all pages and remain lazy inside details. */
export function badgeAssetId(svg: string): string {
    return createHash("sha256").update(svg).digest("hex").slice(0, 24);
}

export function normalizeBadgeStyle(style: string | undefined): BadgeOptions["style"] {
    return style && ["flat", "plastic", "flat-square", "for-the-badge", "social"].includes(style)
        ? (style as BadgeOptions["style"])
        : "flat";
}

/** Keep Data URLs available for custom component badges outside footer.yml. */
export function svgToDataUrl(svg: string): string {
    if (!svg) return "";
    const encoded = encodeURIComponent(svg).replaceAll("'", "%27").replaceAll('"', "%22");
    return `data:image/svg+xml,${encoded}`;
}

type BadgeInput = Omit<BadgeOptions, "style"> & { style?: string };
type BadgeConfig = BadgeInput | { title: string; items: BadgeInput[] };
const assetCache = new WeakMap<readonly BadgeConfig[], Map<string, string>>();

/** Use identical normalization in the component and prerendered asset route. */
export function createBadgeAssets(items: readonly BadgeConfig[] | undefined): Map<string, string> {
    if (!items) return new Map();
    const cached = assetCache.get(items);
    if (cached) return cached;
    const assets = new Map<string, string>();
    for (const item of items) {
        for (const badge of "items" in item ? item.items : [item]) {
            const svg = generateBadge({ ...badge, style: normalizeBadgeStyle(badge.style) });
            assets.set(badgeAssetId(svg), svg);
        }
    }
    assetCache.set(items, assets);
    return assets;
}
