import { readFileSync } from "node:fs";
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
    const entry = Bun.resolveSync(
        "@mcp-b/webmcp-polyfill",
        Bun.fileURLToPath(new URL(".", import.meta.url)),
    );
    const version = (
        JSON.parse(
            readFileSync(
                Bun.fileURLToPath(new URL("../package.json", Bun.pathToFileURL(entry))),
                "utf8",
            ),
        ) as { version: string }
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
