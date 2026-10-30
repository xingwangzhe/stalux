import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const publicId = "virtual:stalux-search-style";
const virtualId = `\0${publicId}`;

/** Astro dev treats a direct CSS ?url import as a module script; keep it a URL-only leaf. */
export function searchStylePlugin(development: boolean, base: string): Plugin {
    const stylesheet = createRequire(import.meta.url)
        .resolve("@pagefind/component-ui/css")
        .replaceAll("\\", "/");
    let building = false;
    return {
        name: "stalux:search-style",
        configResolved(config) {
            building = config.command === "build";
        },
        buildStart() {
            if (building && this.environment.name === "client")
                this.emitFile({
                    type: "chunk",
                    id: fileURLToPath(
                        new URL("../scripts/search-engine-entry.ts", import.meta.url),
                    ),
                    fileName: "pagefind-enhanced/pagefind.js",
                    preserveSignature: "strict",
                });
        },
        configureServer(server) {
            // A linked package can be outside the consumer's workspace root.
            server.config.server.fs.allow.push(stylesheet);
        },
        async resolveId(id, importer) {
            if (id !== publicId) return;
            return development
                ? virtualId
                : this.resolve(`${stylesheet}?url`, importer, { skipSelf: true });
        },
        load(id) {
            if (id !== virtualId) return;
            return `export default ${JSON.stringify(`${base.replace(/\/$/, "")}/@fs${stylesheet}`)};`;
        },
    };
}
