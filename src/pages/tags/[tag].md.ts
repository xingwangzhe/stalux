import { getSite, loadConfig, renderTaxonomyPageMd } from "@utils/ai-discovery";
import { buildTaxonomyStaticPaths } from "@utils/taxonomy";
import type { CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";

export const prerender = true;

export async function getStaticPaths() {
    return buildTaxonomyStaticPaths("tags");
}

export const GET: APIRoute = async (context) => {
    const { tag, posts } = context.props as {
        tag: string;
        posts: CollectionEntry<"posts">[];
    };
    const config = await loadConfig();
    const site = getSite(config, context.site?.toString());
    const text = renderTaxonomyPageMd(tag, posts, site, "tags", true);
    return new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};
