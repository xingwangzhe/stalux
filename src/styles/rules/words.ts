import type { StyleSpec } from "../rule-utils.ts";

export const wordsStyles: StyleSpec[] = [
    [".stalux-word-list-list", "gap-[1rem] m-[1.5rem_auto]", {}, "@media (max-width: 768px)"],
    [".stalux-word-list-item", "max-w-full", {}, "@media (max-width: 768px)"],
    [".stalux-word-body .expressive-code", "max-w-full overflow-x-auto", {}],
    [
        ".stalux-word-card:hover",
        "",
        { background: "var(--white-05p)", "box-shadow": "var(--card-box-shadow-hover)" },
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
