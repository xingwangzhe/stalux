import { getSite, loadConfig, renderRobotsAiTxt } from "@utils/ai-discovery";
import { isAiFileEnabled } from "@utils/ai-discovery";
import { getAiDiscoveryData } from "@utils/config-utils";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

export const GET: APIRoute = async (context) => {
    const configEntries = await getCollection("config");
    const aiConfig = getAiDiscoveryData(configEntries);
    if (!isAiFileEnabled(aiConfig?.conformance, "robots-ai.txt")) {
        return new Response("File disabled by ai-discovery config.\n", {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    }
    const config = await loadConfig();
    const site = getSite(config, context.site?.toString());
    const text = renderRobotsAiTxt(config, site);

    return new Response(text, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
};
