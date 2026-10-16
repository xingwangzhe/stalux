import astroPackage from "astro/package.json" with { type: "json" };
import type { Plugin } from "vite";

/**
 * Astro 7 loads Markdown before replacing its propagated-assets module with
 * imports of the real content module. That throwaway load renders the same
 * document twice. The propagation transform ignores its input entirely.
 *
 * Only skip this internal forwarding module, never the real content module,
 * direct imports, Markdown pages, or MDX (which owns a different pipeline).
 * The internal transform has been verified on 7.4.0 only. Future Astro versions
 * use the ordinary pipeline until their propagation contract is rechecked.
 */
export function markdownPropagationPlugin(): Plugin {
    return {
        name: "stalux:markdown-propagation",
        enforce: "pre",
        apply: (_, environment) =>
            environment.command === "build" && astroPackage.version === "7.4.0",
        load: {
            order: "pre",
            filter: { id: /\.(?:md|markdown)\?astroPropagatedAssets$/u },
            handler() {
                return "";
            },
        },
    };
}
