import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

import { getAiDiscoveryData, getSiteData } from "@utils/config-utils";
import { getSite, isAiFileEnabled, llmsTxtToHtml, loadConfig, renderLlmsTxt } from "@utils/ai-discovery";

export const prerender = true;

export const GET: APIRoute = async (context) => {
    const configEntries = await getCollection("config");
    const configMap = await loadConfig();
    const aiConfig = getAiDiscoveryData(configEntries);
    const site = getSite(configMap, context.site?.toString());

    if (!isAiFileEnabled(aiConfig?.conformance, "llms.html")) {
        return new Response(
            "<!DOCTYPE html><html lang=en><head><meta charset=utf-8><meta name=robots content=noindex></head><body><p>File disabled by ai-discovery config.</p></body></html>",
            { headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
    }

    const siteData = getSiteData(configEntries);
    const llmsText = await renderLlmsTxt(configMap, site);
    const llmsHtml = llmsTxtToHtml(llmsText);
    const title = siteData?.title ?? "Blog";
    const description = siteData?.description ?? "";
    const lang = siteData?.lang ?? "zh-CN";

    const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        name: title,
        url: site,
        description,
    });

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>${title} - llms.txt</title>
    <link rel="canonical" href="${site}/llms.txt">
    <script type="application/ld+json">${jsonLd}</script>
    <style>
        body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:2rem 1rem;color:#222;background:#fff}
        a{color:#06c}
        blockquote{color:#555;border-left:4px solid #ccc;margin:0;padding-left:1rem}
        ul{padding-left:1.5rem}
        li{margin:.25rem 0}
        h1,h2{margin-top:1.5rem}
        .notice{background:#f5f5f5;border:1px solid #ddd;border-radius:.5rem;margin-bottom:1.5rem;padding:.75rem 1rem}
    </style>
</head>
<body>
    <p class="notice"><strong>Human-readable version of <a href="${site}/llms.txt">/llms.txt</a></strong></p>
    ${llmsHtml}
</body>
</html>`;

    return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
};
