import { getSite, isMarkdownExportEnabled, loadConfig, renderAboutMd } from "@utils/ai-discovery";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async (context) => {
    const config = await loadConfig();
    if (!isMarkdownExportEnabled(config)) return new Response(null, { status: 404 });

    const site = getSite(config, context.site?.toString());
    const text = await renderAboutMd(site);
    return new Response(text, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
};
