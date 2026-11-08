import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";

/** Keep a source-only devDependency optional in published consumer projects. */
export function swupDebugPlugin(development: boolean): Plugin {
    const id = "virtual:stalux-swup-debug";
    let entry: string | undefined;
    if (development) {
        try {
            // require.resolve honours the "require" condition and returns the CJS
            // build. Re-exporting that from a virtual ESM module makes the browser
            // fail with "does not provide an export named 'default'". Pick the
            // package's ESM entry from its manifest instead.
            const cjs = createRequire(import.meta.url).resolve("@swup/debug-plugin");
            const manifest = resolve(dirname(cjs), "../package.json");
            const pkg = JSON.parse(readFileSync(manifest, "utf8")) as {
                exports?: { "."?: { import?: string } };
                module?: string;
            };
            const esm = pkg.exports?.["."]?.import ?? pkg.module;
            if (esm) entry = resolve(dirname(manifest), esm);
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
