import type { Node } from "@takumi-rs/core";
import type { SocialCardData } from "../utils/social-image";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;
export const CARD_MARGIN = 72;
export const COVER_WIDTH = 440;
export const CARD_FONT_FAMILY = "Stalux Card";

const MUTED = "#545454";
const RULE = "rgba(0, 0, 0, 0.16)";

const text = (value: string, style: Record<string, unknown>): Node =>
    ({ type: "text", text: value, style }) as Node;

const rule = (top: number, width: number): Node =>
    ({
        type: "container",
        style: {
            position: "absolute",
            left: CARD_MARGIN,
            top,
            width,
            height: 1,
            backgroundColor: RULE,
        },
    }) as Node;

const row = (top: number, width: number, children: Node[]): Node =>
    ({
        type: "container",
        style: {
            position: "absolute",
            left: CARD_MARGIN,
            top,
            width,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
        },
        children,
    }) as Node;

function header(data: SocialCardData, textWidth: number): Node {
    return row(50, textWidth, [
        text(data.siteTitle, {
            fontSize: 26,
            lineHeight: 1.2,
            maxWidth: "62%",
            lineClamp: 1,
            overflow: "hidden",
            color: "#000000",
        }),
        text(data.category || "", {
            width: textWidth < 700 ? 180 : 240,
            textAlign: "right",
            fontSize: 19,
            letterSpacing: 3,
            lineHeight: 1.2,
            lineClamp: 1,
            overflow: "hidden",
            color: "#000000",
        }),
    ]);
}

function footer(data: SocialCardData, textWidth: number): Node {
    return row(550, textWidth, [
        text(data.host, { fontSize: 22, lineHeight: 1.3, color: "#000000" }),
        text(`${data.author}  /  ${data.date}`, {
            fontSize: 22,
            lineHeight: 1.3,
            textAlign: "right",
            color: MUTED,
        }),
    ]);
}

/**
 * A fixed editorial layout: black type on white, one full-colour artwork panel.
 * No accent colour, gradients, or decoration — the title, metadata and image
 * carry it. Every text block is black or neutral gray; only the cover is colour.
 */
export function socialCardTree(data: SocialCardData, withCover = false): Node {
    const textWidth = withCover
        ? CARD_WIDTH - COVER_WIDTH - CARD_MARGIN * 2
        : CARD_WIDTH - CARD_MARGIN * 2;
    const children: Node[] = [
        header(data, textWidth),
        rule(106, textWidth),
        text(data.title, {
            position: "absolute",
            left: CARD_MARGIN,
            top: 156,
            width: textWidth,
            fontSize: 58,
            lineHeight: 1.2,
            lineClamp: 3,
            overflow: "hidden",
            overflowWrap: "anywhere",
            color: "#000000",
        }),
    ];
    if (data.tags.length > 0)
        children.push(
            text(data.tags.map((tag) => `#${tag}`).join("  ·  "), {
                position: "absolute",
                left: CARD_MARGIN,
                top: 384,
                width: textWidth,
                fontSize: 23,
                lineHeight: 1.3,
                lineClamp: 1,
                overflow: "hidden",
                color: "#000000",
            }),
        );
    children.push(
        text(data.postUrl.replace(/^https?:\/\//u, ""), {
            position: "absolute",
            left: CARD_MARGIN,
            top: 426,
            width: textWidth,
            fontSize: 21,
            lineHeight: 1.3,
            lineClamp: 1,
            overflow: "hidden",
            color: MUTED,
        }),
        rule(532, textWidth),
        footer(data, textWidth),
    );
    if (withCover)
        children.push({
            type: "image",
            src: "stalux-cover",
            style: {
                position: "absolute",
                right: 0,
                top: 0,
                width: COVER_WIDTH,
                height: CARD_HEIGHT,
                objectFit: "cover",
            },
        } as Node);
    return {
        type: "container",
        style: {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            position: "relative",
            backgroundColor: "#ffffff",
            color: "#000000",
            fontFamily: CARD_FONT_FAMILY,
            overflow: "hidden",
        },
        children,
    } as Node;
}
