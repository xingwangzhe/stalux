import { realpathSync } from "node:fs";

/** Linked consumers still need injected routes; only the theme's own root has file routes. */
export function isPluginProject(projectRoot: URL, themeRoot: URL): boolean {
    return (
        realpathSync(Bun.fileURLToPath(projectRoot)) !== realpathSync(Bun.fileURLToPath(themeRoot))
    );
}
