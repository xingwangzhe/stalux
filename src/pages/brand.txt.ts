import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

import { isAiFileEnabled, loadConfig, renderBrandTxt } from "@utils/ai-discovery";
import { getAiDiscoveryData } from "@utils/config-utils";

export const prerender = true;

export const GET: APIRoute = async () => {
    const configEntries = await getCollection("config");
    const aiConfig = getAiDiscoveryData(configEntries);
    if (!isAiFileEnabled(aiConfig?.conformance, "brand.txt")) {
        return new Response("# File disabled by ai-discovery config.\n", {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    }

    const config = await loadConfig();
    const text = renderBrandTxt(config);

    return new Response(text, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
};
