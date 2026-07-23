import { getSite, loadConfig, renderTaxonomyPageMd } from "@utils/ai-discovery";
import { buildTaxonomyStaticPaths } from "@utils/taxonomy";
import type { CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";

export const prerender = true;

export async function getStaticPaths() {
    return buildTaxonomyStaticPaths("categories");
}

export const GET: APIRoute = async (context) => {
    const { category, posts } = context.props as {
        category: string;
        posts: CollectionEntry<"posts">[];
    };
    const config = await loadConfig();
    const site = getSite(config, context.site?.toString());
    const text = renderTaxonomyPageMd(category, posts, site, "categories", true);
    return new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};
