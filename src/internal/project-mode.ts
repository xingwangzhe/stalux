import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Linked consumers still need injected routes; only the theme's own root has file routes. */
export function isPluginProject(projectRoot: URL, themeRoot: URL): boolean {
    return realpathSync(fileURLToPath(projectRoot)) !== realpathSync(fileURLToPath(themeRoot));
}
