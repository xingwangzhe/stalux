import { getCollection } from "astro:content";
import paths from "virtual:stalux-social-card-paths";
import type { APIRoute } from "astro";
import { createSocialCardData } from "../../internal/social-card-data";
import { renderSocialCard } from "../../internal/social-card-renderer";
import { getAuthorData, getSiteData } from "../../utils/config-utils";
import { getPostContentIndex } from "../../utils/content-index";
import { isSocialImageUrl, type SocialCardData, socialCardPath } from "../../utils/social-image";

export async function getStaticPaths() {
    const entries = await getCollection("config");
    const site = getSiteData(entries);
    const author = getAuthorData(entries);
    const { posts } = await getPostContentIndex();
    return posts
        .filter(
            (post) =>
                !post.data["og:image"]?.trim() || !isSocialImageUrl(post.data["og:image"].trim()),
        )
        .flatMap((post) => {
            const card = createSocialCardData(post.data, site, author);
            // PNG only. og:image must stay PNG because several platforms refuse
            // WebP and AVIF in share previews, and a second format per post
            // doubled the render work (about 8s each) for no visible gain.
            return (["png"] as const).map((format) => ({
                params: {
                    image: socialCardPath(card)
                        .split("/")
                        .at(-1)
                        ?.replace(/\.png$/u, ""),
                    format,
                },
                props: { card, format },
                // Covers may change independently of Markdown. Always recheck them; the renderer
                // has its own content cache and writes outputs even after Astro cleans dist.
            }));
        });
}

export const GET: APIRoute = async ({ props, logger }) => {
    const bytes = await renderSocialCard(
        props.card as SocialCardData,
        paths,
        (message) => logger.warn(message),
        props.format as "webp" | "png",
    );
    return new Response(new Uint8Array(bytes), {
        headers: { "Content-Type": `image/${props.format}` },
    });
};
