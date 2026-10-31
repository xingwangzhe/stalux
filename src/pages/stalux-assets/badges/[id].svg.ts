import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { createBadgeAssets } from "../../../utils/badge-generator";
import { getFooterData } from "../../../utils/config-utils";

export const prerender = true;

export async function getStaticPaths() {
    const footer = getFooterData(await getCollection("config"));
    const assets = createBadgeAssets(footer?.badges);
    return [...assets].map(([id, svg]) => ({ params: { id }, props: { svg } }));
}

export const GET: APIRoute = ({ props }) =>
    new Response(props.svg, {
        headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    });
