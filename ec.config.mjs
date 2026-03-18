import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { defineEcConfig } from "astro-expressive-code";

export default defineEcConfig({
    themes: ["github-dark"],
    useDarkModeMediaQuery: false,
    plugins: [pluginLineNumbers()],
});
