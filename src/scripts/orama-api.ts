import { createClientLogger } from "./logger";

declare const __STALUX_ORAMA_ENABLED__: boolean;

const logger = createClientLogger("webmcp/orama");
let engine: ReturnType<typeof import("./orama-client").createOramaSearch> | undefined;

export async function loadOrama() {
    if (!__STALUX_ORAMA_ENABLED__) return null;
    try {
        const { createOramaSearch } = await import("./orama-client");
        engine ??= createOramaSearch(import.meta.env.BASE_URL);
        await engine.ready();
        return engine;
    } catch {
        logger.warn("Orama index unavailable; retry the search");
        return null;
    }
}
