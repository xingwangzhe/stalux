import type { StyleSpec } from "../rule-utils.ts";

export const wordsStyles: StyleSpec[] = [
    [
        ".stalux-word-card",
        "",
        {
            "border-top": "2px solid var(--accent-50p)",
            "overflow-wrap": "anywhere",
            "scroll-margin-top": "6rem",
        },
    ],
    [".stalux-word-mark", "", { color: "var(--accent-80p)", flex: "none" }],
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
            animation: "stalux-word-word-glow 2s ease-out",
            "box-shadow":
                "0 0 20px var(--accent-40p), 0 0 60px var(--accent-20p), var(--shadow-lg)",
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
