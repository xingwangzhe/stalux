import astroPackage from "astro/package.json" with { type: "json" };
import type { Plugin } from "vite";

/**
 * Astro 7 loads Markdown before replacing its propagated-assets module with
 * imports of the real content module. That throwaway load renders the same
 * document twice. The propagation transform ignores its input entirely.
 *
 * Only skip this internal forwarding module, never the real content module,
 * direct imports, Markdown pages, or MDX (which owns a different pipeline).
 * The internal transform has been checked on Astro 7.4.0 and 7.4.13.
 * Other versions use the ordinary pipeline until their contract is checked.
 */
export function markdownPropagationPlugin(): Plugin {
    const supported = ["7.4.0", "7.4.13"].includes(astroPackage.version);
    return {
        name: "stalux:markdown-propagation",
        enforce: "pre",
        apply: (_, environment) => environment.command === "build" && supported,
        load: {
            order: "pre",
            filter: { id: /\.(?:md|markdown)\?astroPropagatedAssets$/u },
            handler() {
                return "";
            },
        },
    };
}
