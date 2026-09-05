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

/**
 * 将SVG字符串转为Data URL
 * @param svg SVG字符串
 * @returns data URL
 */
export function svgToDataUrl(svg: string): string {
    if (!svg) return "";
    const encoded = encodeURIComponent(svg).replaceAll("'", "%27").replaceAll('"', "%22");
    return `data:image/svg+xml,${encoded}`;
}
