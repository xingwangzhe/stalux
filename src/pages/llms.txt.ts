import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

import { getSite, loadConfig, renderLlmsTxt } from "@utils/ai-discovery";
import { getAiDiscoveryData } from "@utils/config-utils";
import { isAiFileEnabled } from "@utils/ai-discovery";

export const prerender = true;

export const GET: APIRoute = async (context) => {
    const configEntries = await getCollection("config");
    const aiConfig = getAiDiscoveryData(configEntries);
    if (!isAiFileEnabled(aiConfig?.conformance, "llms.txt")) {
        return new Response("File disabled by ai-discovery config.\n", {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    }
    const config = await loadConfig();
    const site = getSite(config, context.site?.toString());
    const text = await renderLlmsTxt(config, site);

    return new Response(text, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
};
