import {
    getSite,
    isMarkdownExportEnabled,
    loadConfig,
    renderArchivesMd,
} from "@utils/ai-discovery";
import { createTranslator } from "@utils/i18n";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async (context) => {
    const config = await loadConfig();
    const exportMd = isMarkdownExportEnabled(config);
    if (!exportMd) return new Response(null, { status: 404 });

    const site = getSite(config, context.site?.toString());
    const lang = (config.get("site")?.lang as string) || "zh-CN";
    const { t } = createTranslator(lang);
    const text = await renderArchivesMd(site, exportMd, t, context.logger);
    return new Response(text, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            Vary: "Accept, Accept-Encoding",
        },
    });
};
