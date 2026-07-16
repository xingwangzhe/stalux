/**
 * 徽章生成器工具
 * 基于 badge-maker 库生成徽章
 */
import { makeBadge } from "badge-maker";

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
}

/**
 * 生成徽章SVG
 * @param options 徽章选项
 * @returns 返回徽章SVG字符串
 */
export function generateBadge(options: BadgeOptions): string {
    try {
        const format = Object.fromEntries(
            Object.entries({
                label: options.label,
                message: options.message,
                color: options.color ?? "blue",
                style: options.style ?? "flat",
                labelColor: options.labelColor,
                logo: options.logo,
                logoWidth: options.logoWidth,
            }).filter(([, v]) => v !== undefined),
        ) as Parameters<typeof makeBadge>[0];

        return makeBadge(format);
    } catch (error) {
        console.error("Badge generation error:", error);
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
