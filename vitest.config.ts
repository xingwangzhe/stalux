/// <reference types="vitest/config" />

import { getViteConfig } from "astro/config";

export default getViteConfig({
    test: {
        include: ["tests/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary", "html"],
            reportsDirectory: "./coverage",
            include: [
                "scripts/verify-build-utils.ts",
                "src/internal/runtime-cache-key.ts",
                "src/internal/image-dimensions.ts",
                "src/internal/html-output.ts",
                "src/internal/bounded-tasks.ts",
                "src/utils/post-lookup.ts",
                "src/utils/word-count-utils.ts",
                "src/internal/satteri-config.ts",
                "src/scripts/page-runtime.ts",
                "src/scripts/pagefind-api.ts",
                "src/utils/site-path.ts",
                "src/scripts/back-to-top.ts",
                "src/scripts/archive-reveal.ts",
                "src/scripts/archive-descriptions.ts",
                "src/scripts/typewriter.ts",
                "src/scripts/weather.ts",
                "src/scripts/logger.ts",
                "src/utils/diagnostics.ts",
                "src/scripts/retryable-initializer.ts",
                "src/scripts/search-dialog.ts",
                "src/utils/cc.ts",
                "src/utils/content-index.ts",
                "src/utils/public-routes.ts",
                "src/utils/seo-document.ts",
            ],
            thresholds: {
                branches: 80,
                functions: 80,
                lines: 80,
                statements: 80,
            },
        },
    },
});
