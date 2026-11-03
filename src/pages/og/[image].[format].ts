import { getCollection } from "astro:content";
import paths from "virtual:stalux-social-card-paths";
import type { APIRoute } from "astro";
import { createSocialCardData } from "../../internal/social-card-data";
import { renderSocialCard } from "../../internal/social-card-renderer";
import { getAuthorData, getSiteData } from "../../utils/config-utils";
import { getPostContentIndex } from "../../utils/content-index";
import {
    isSocialImageUrl,
    type SocialCardData,
    type SocialCardFormat,
    socialCardPath,
} from "../../utils/social-image";

export async function getStaticPaths() {
    const entries = await getCollection("config");
    const site = getSiteData(entries);
    const author = getAuthorData(entries);
    const { posts } = await getPostContentIndex();
    return posts
        .filter(
            (post) =>
                !(post.data["og:image"]?.trim() && isSocialImageUrl(post.data["og:image"].trim())),
        )
        .map((post) => {
            const card = createSocialCardData(post.data, site, author);
            // The extension is part of the metadata contract: artwork cards are
            // photographic JPEG, plain cards are palette PNG.
            const file = socialCardPath(card).split("/").at(-1) ?? "";
            const dot = file.lastIndexOf(".");
            return {
                params: {
                    image: file.slice(0, dot),
                    format: file.slice(dot + 1) as SocialCardFormat,
                },
                props: { card, format: file.slice(dot + 1) as SocialCardFormat },
            };
        });
}

export const GET: APIRoute = async ({ props, logger }) => {
    const bytes = await renderSocialCard(props.card as SocialCardData, paths, (message) =>
        logger.warn(message),
    );
    const type = props.format === "jpg" ? "image/jpeg" : "image/png";
    return new Response(new Uint8Array(bytes), {
        headers: { "Content-Type": type },
    });
};
