import type { StyleSpec } from "../rule-utils.ts";

export const wordsStyles: StyleSpec[] = [
    [
        ".stalux-word-card",
        "",
        {
            // Transparent fill, but a full outline on every side. With only a
            // left rule and no background the cards had nothing separating them:
            // a quote ending in a short line and the next one starting looked
            // like a single block. The accent stays a *marker* (left rule, quote
            // glyph, links) while the outline does the dividing work.
            border: "1px solid var(--white-15p)",
            "border-left": "3px solid var(--accent-50p)",
            background: "transparent",
            // Softens whatever the page background shows through the card so the
            // text keeps its contrast without painting a slab over the artwork.
            "backdrop-filter": "blur(3px)",
            "overflow-wrap": "anywhere",
            "scroll-margin-top": "6rem",
        },
    ],
    [
        ".stalux-word-mark",
        "",
        {
            color: "var(--accent-60p)",
            position: "absolute",
            top: "1.5rem",
            right: "1.5rem",
            opacity: "0.45",
            "pointer-events": "none",
        },
    ],
    [".stalux-word-body", "", { "padding-right": "2.5rem" }],
    [
        ".stalux-word-footer",
        "",
        {
            padding: "0.75rem 0 0",
            background: "none",
            "backdrop-filter": "none",
            "text-align": "left",
        },
    ],
    [".stalux-word-source-meta", "", { "text-align": "right" }],
    [
        ".stalux-word-source-link",
        "",
        { "min-height": "44px", display: "inline-flex", "align-items": "center" },
    ],
    [
        ".stalux-word-permalink",
        "",
        {
            display: "inline-flex",
            "align-items": "center",
            "min-height": "44px",
            color: "var(--white-70p)",
            "font-variant-numeric": "tabular-nums",
        },
    ],
    [
        ".stalux-word-permalink:focus-visible, .stalux-word-source-link:focus-visible",
        "",
        {
            outline: "2px solid var(--stalux-accent-color)",
            "outline-offset": "4px",
            "border-radius": "4px",
        },
    ],
    [".stalux-word-card", "", { padding: "1.25rem" }, "@media (max-width: 768px)"],
    [".stalux-word-source-meta", "", { "margin-left": "auto", "min-width": "0" }],
    [".stalux-word-body > :first-child", "", { "margin-top": "0" }],
    [".stalux-word-body > :last-child", "", { "margin-bottom": "0" }],
    [".stalux-word-list-list", "gap-[1rem] m-[1.5rem_auto]", {}, "@media (max-width: 768px)"],
    [".stalux-word-list-item", "max-w-full", {}, "@media (max-width: 768px)"],
    [".stalux-word-body .expressive-code", "max-w-full overflow-x-auto", {}],
    [
        ".stalux-word-card:hover",
        "",
        { "border-color": "var(--accent-80p)", "box-shadow": "var(--card-box-shadow-hover)" },
    ],
    [
        ".stalux-word-card:target, .stalux-word-card[data-glow]",
        "",
        {
            "border-color": "var(--accent-90p)",
        },
    ],
    [
        ".stalux-word-body h1, .stalux-word-body h2, .stalux-word-body h3, .stalux-word-body h4, .stalux-word-body h5, .stalux-word-body h6",
        "text-[1.1em] m-[0.5rem_0]",
        {},
    ],
    [".stalux-word-body p", "m-[0.5rem_0]", {}],
    [
        ".stalux-word-body blockquote",
        "m-[0.5rem_0] p-[0.6rem_1rem]",
        { "border-left": "3px solid var(--accent-60p)", background: "var(--white-05p)" },
    ],
    [
        ".stalux-word-body pre",
        "",
        { "white-space": "pre-wrap", "overflow-wrap": "anywhere", "overflow-x": "visible" },
    ],
    [".stalux-word-body code", "", { "overflow-wrap": "anywhere" }],
    [".stalux-word-source-link:hover", "", { color: "var(--accent-90p)" }],
];
