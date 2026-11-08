import { createRequire } from "node:module";
import type { Plugin } from "vite";

/** Keep a source-only devDependency optional in published consumer projects. */
export function swupDebugPlugin(development: boolean): Plugin {
    const id = "virtual:stalux-swup-debug";
    let entry: string | undefined;
    if (development) {
        try {
            entry = createRequire(import.meta.url).resolve("@swup/debug-plugin");
        } catch {
            // Consumers can install @swup/debug-plugin as their own devDependency.
        }
    }
    return {
        name: "stalux:swup-debug",
        resolveId: (source) => (source === id ? `\0${id}` : undefined),
        load: (source) =>
            source === `\0${id}`
                ? entry
                    ? `export { default } from ${JSON.stringify(entry)};`
                    : "export default null;"
                : undefined,
    };
}
