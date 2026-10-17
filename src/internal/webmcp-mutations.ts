import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import type { Plugin } from "vite";
import { affectsDeclarativeTools } from "../scripts/webmcp-mutations";

const observer = "const observer = new MutationObserver(sync);";

/** Upstream 5.1.0 rescans every element even for unrelated clock/background mutations. */
export function optimizeWebMcpMutations(code: string, version: string): string | undefined {
    if (
        version !== "5.1.0" ||
        !code.includes("function installDeclarativeForms(document, context)") ||
        code.split(observer).length !== 2
    )
        return;
    return code.replace(
        observer,
        `const relevant = ${affectsDeclarativeTools.toString()};\nconst observer = new MutationObserver((records) => { if (relevant(records)) sync(); });`,
    );
}

export function webMcpMutationsPlugin(): Plugin {
    const entry = createRequire(import.meta.url).resolve("@mcp-b/webmcp-polyfill");
    const version = JSON.parse(
        readFileSync(new URL("../package.json", pathToFileURL(entry)), "utf8"),
    ).version;
    return {
        name: "stalux:webmcp-mutations",
        enforce: "pre",
        transform(code, id) {
            if (!id.replaceAll("\\", "/").endsWith("/@mcp-b/webmcp-polyfill/dist/index.js")) return;
            const optimized = optimizeWebMcpMutations(code, version);
            if (optimized) return { code: optimized, map: null };
        },
    };
}
