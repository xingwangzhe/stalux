import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { createIndex } from "pagefind";

/**
 * Pagefind Astro integration — runs Pagefind post-build to index the static site
 * for full-text search. The index is consumed by @pagefind/component-ui on the client.
 */
export function pagefind(): AstroIntegration {
    return {
        name: "pagefind",
        hooks: {
            "astro:build:done": async ({ dir, logger }) => {
                const outDir = fileURLToPath(dir);
                logger.info("Running Pagefind indexer...");

                const { index, errors } = await createIndex();
                if (!index) {
                    logger.error("Pagefind failed to create index");
                    errors?.forEach((e) => logger.error(e));
                    return;
                }

                const { page_count } = await index.addDirectory({ path: outDir });
                if (page_count === 0) {
                    logger.warn("Pagefind: no pages indexed");
                    return;
                }

                const { outputPath } = await index.writeFiles({
                    outputPath: path.join(outDir, "pagefind"),
                });
                logger.info(`Pagefind indexed ${page_count} pages → ${outputPath}`);

                // Copy @pagefind/component-ui assets alongside the index
                const compEntry = fileURLToPath(
                    import.meta.resolve("@pagefind/component-ui"),
                );
                const compPkg = path.resolve(compEntry, "../../..");
                const uiDir = path.join(outDir, "pagefind");

                fs.copyFileSync(
                    path.join(compPkg, "npm_dist/mjs/component-ui.mjs"),
                    path.join(uiDir, "pagefind-component-ui.js"),
                );
                fs.copyFileSync(
                    path.join(compPkg, "css/pagefind-component-ui.css"),
                    path.join(uiDir, "pagefind-component-ui.css"),
                );
                logger.info("Pagefind Component UI assets copied to pagefind/");
            },
        },
    };
}
