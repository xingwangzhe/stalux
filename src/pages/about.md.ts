import { getSite, loadConfig, renderAboutMd } from "@utils/ai-discovery";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async (context) => {
    const config = await loadConfig();
    const site = getSite(config, context.site?.toString());
    const text = await renderAboutMd(site);
    return new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};
