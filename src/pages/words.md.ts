import {
    isMarkdownExportEnabled,
    loadConfig,
    renderWordsMd,
    resolveSiteTimezone,
} from "@utils/ai-discovery";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async () => {
    const config = await loadConfig();
    if (!isMarkdownExportEnabled(config)) return new Response(null, { status: 404 });

    const text = await renderWordsMd(resolveSiteTimezone(config));
    return new Response(text, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            Vary: "Accept, Accept-Encoding",
        },
    });
};
