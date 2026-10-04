import { styleNameIn } from "../internal/style-name-lookup.ts";
import { styleNames } from "../internal/style-names.generated.ts";

declare const __STALUX_COMPACT_STYLES__: boolean;

/** Resolve dynamically assembled theme names without changing development output. */
export function productionStyleName(name: string): string {
    if (typeof __STALUX_COMPACT_STYLES__ === "undefined" || !__STALUX_COMPACT_STYLES__) return name;
    return (
        styleNameIn(styleNames.classes, name) ??
        styleNameIn(styleNames.variables, name) ??
        styleNameIn(styleNames.animations, name) ??
        name
    );
}
