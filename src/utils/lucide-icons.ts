import { type AstroComponent, icons } from "@lucide/astro";
import type { AstroRuntimeLogger } from "astro";

export function getLucideIcon(
    iconName: string | undefined | null,
    logger?: AstroRuntimeLogger,
): AstroComponent | null {
    if (!iconName) return null;

    // Preserve legacy Stalux navigation names.
    let slug = iconName;
    if (iconName === "home") slug = "house";
    if (iconName === "wormhole") slug = "shell";
    const exportName = slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
    if (Object.hasOwn(icons, exportName)) {
        return icons[exportName as keyof typeof icons];
    }

    logger?.warn(
        `[stalux/icons] Unknown icon "${iconName}" in stalux/config/navs.yml. Use a name from https://lucide.dev/icons/.`,
    );
    return null;
}
