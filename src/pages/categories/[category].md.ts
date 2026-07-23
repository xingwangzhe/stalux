import {
    getSite,
    isMarkdownExportEnabled,
    loadConfig,
    renderTaxonomyPageMd,
} from "@utils/ai-discovery";
import { buildTaxonomyStaticPaths } from "@utils/taxonomy";
import type { APIRoute } from "astro";
import type { CollectionEntry } from "astro:content";

export const prerender = true;

export async function getStaticPaths() {
    const config = await loadConfig();
    if (!isMarkdownExportEnabled(config)) return [];

    return buildTaxonomyStaticPaths("categories");
}

export const GET: APIRoute = async (context) => {
    const config = await loadConfig();
    const exportMd = isMarkdownExportEnabled(config);
    if (!exportMd) return new Response(null, { status: 404 });

    const { category, posts } = context.props as {
        category: string;
        posts: CollectionEntry<"posts">[];
    };
    const site = getSite(config, context.site?.toString());
    const text = renderTaxonomyPageMd(category, posts, site, "categories", exportMd);
    return new Response(text, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
};
