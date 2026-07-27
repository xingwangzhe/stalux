/**
 * Pagefind 搜索索引生成器
 *
 * 从原 src/integrations/pagefind.ts 迁移而来，
 * 变为集成的一个内部模块，在构建完成时自动运行。
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegrationLogger } from "astro";

export async function pagefind(dir: URL, logger: AstroIntegrationLogger): Promise<void> {
    const outDir = fileURLToPath(dir);
    logger.info("Running Pagefind indexer...");

    try {
        const { createIndex } = await import("pagefind");
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
    } catch (error) {
        logger.error(`Pagefind indexing failed: ${error}`);
    }
}
