import type { Plugin } from "vite";

export function searchEntryPlugin(): Plugin {
    return {
        name: "stalux:search-entry",
        apply: "build",
        buildStart() {
            if (this.environment.name !== "client") return;
            this.emitFile({
                type: "chunk",
                id: Bun.fileURLToPath(
                    new URL("../scripts/search-engine-entry.ts", import.meta.url),
                ),
                fileName: "pagefind-enhanced/pagefind.js",
                preserveSignature: "strict",
            });
        },
    };
}
