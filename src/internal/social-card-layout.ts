import type { SocialCardData } from "../utils/social-image";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;
export const CARD_MARGIN = 72;
export const COVER_WIDTH = 440;
export const COVER_LEFT = CARD_WIDTH - COVER_WIDTH;
export const CARD_FONT_FAMILY = "Stalux Card";
export const CARD_FONT_WEIGHT = 400;

export interface CardNode {
    type: string;
    props: Record<string, unknown> & { style?: Record<string, unknown>; children?: unknown };
}

const text = (value: string, style: Record<string, unknown>): CardNode => ({
    type: "div",
    // `display: block` is what enables `lineClamp` and its ellipsis in Satori.
    props: { style: { display: "block", overflow: "hidden", ...style }, children: value },
});

const rule = (top: number, width: number): CardNode => ({
    type: "div",
    props: {
        style: {
            position: "absolute",
            left: CARD_MARGIN,
            top,
            width,
            height: 1,
            backgroundColor: "rgba(0, 0, 0, 0.16)",
        },
    },
});

const row = (top: number, width: number, children: CardNode[]): CardNode => ({
    type: "div",
    props: {
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
    },
});

function header(data: SocialCardData, textWidth: number): CardNode {
    return row(50, textWidth, [
        text(data.siteTitle, {
            fontSize: 26,
            lineHeight: 1.2,
            maxWidth: "62%",
            lineClamp: 1,
            color: "#000000",
        }),
        text(data.category || "", {
            width: textWidth < 700 ? 180 : 240,
            textAlign: "right",
            fontSize: 19,
            letterSpacing: 3,
            lineHeight: 1.2,
            lineClamp: 1,
            color: "#000000",
        }),
    ]);
}

function footer(data: SocialCardData, textWidth: number): CardNode {
    return row(550, textWidth, [
        text(data.host, { fontSize: 22, lineHeight: 1.3, color: "#000000" }),
        text(`${data.author}  /  ${data.date}`, {
            fontSize: 22,
            lineHeight: 1.3,
            textAlign: "right",
            color: "#545454",
        }),
    ]);
}

/**
 * A fixed editorial layout: black type on white, one full-colour artwork panel.
 * No accent colour, gradients, or decoration — the title and the image carry it.
 */
export function socialCardTree(data: SocialCardData, withCover = false, cover?: string): CardNode {
    const textWidth = withCover
        ? CARD_WIDTH - COVER_WIDTH - CARD_MARGIN * 2
        : CARD_WIDTH - CARD_MARGIN * 2;
    const children: CardNode[] = [
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
            overflowWrap: "anywhere",
            color: "#000000",
        }),
        text(data.description.replace(/\s+/gu, " ").trim(), {
            position: "absolute",
            left: CARD_MARGIN,
            top: 398,
            width: textWidth,
            fontSize: 24,
            lineHeight: 1.55,
            lineClamp: 2,
            overflowWrap: "anywhere",
            color: "#545454",
        }),
        rule(532, textWidth),
        footer(data, textWidth),
    ];
    if (cover)
        children.push({
            type: "img",
            props: {
                src: cover,
                style: {
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: COVER_WIDTH,
                    height: CARD_HEIGHT,
                    objectFit: "cover",
                },
            },
        });
    return {
        type: "div",
        props: {
            style: {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                position: "relative",
                display: "flex",
                backgroundColor: "#ffffff",
                color: "#000000",
                fontFamily: CARD_FONT_FAMILY,
                overflow: "hidden",
            },
            lang: data.lang,
            children,
        },
    };
}
