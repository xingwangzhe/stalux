import { getCollection } from "astro:content";
import { getSite, isAiFileEnabled, loadConfig, renderLlmsFullTxt } from "@utils/ai-discovery";
import { getAiDiscoveryData } from "@utils/config-utils";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async (context) => {
    const configEntries = await getCollection("config");
    const aiConfig = getAiDiscoveryData(configEntries);
    if (!isAiFileEnabled(aiConfig?.conformance, "llms-full.txt")) {
        return new Response("File disabled by ai-discovery config.\n", {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    }
    const config = await loadConfig();
    const site = getSite(config, context.site?.toString());
    const text = await renderLlmsFullTxt(config, site);

    return new Response(text, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            Vary: "Accept, Accept-Encoding",
        },
    });
};
