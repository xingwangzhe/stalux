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
                "scripts/verify-build-utils.mjs",
                "src/internal/runtime-cache-key.ts",
                "src/internal/satteri-config.ts",
                "src/scripts/page-runtime.ts",
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
