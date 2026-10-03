import type { StyleSpec } from "../rule-utils.ts";

export const categoriesStyles: StyleSpec[] = [
    [
        ".stalux-categories > li",
        "",
        {
            "content-visibility": "auto",
            "contain-intrinsic-block-size": "auto 180px",
            "overflow-clip-margin": "30px",
        },
    ],
    [
        ".stalux-categories > li",
        "",
        { "contain-intrinsic-block-size": "auto" },
        "@supports not (content-visibility: auto)",
    ],
    [
        ".stalux-category-card::before",
        "absolute z-[1] pointer-events-none",
        {
            content: '""',
            inset: "0",
            background:
                "linear-gradient( 120deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0) )",
            transform: "translateX(-100%)",
            transition: "transform 360ms ease",
        },
    ],
    [
        ".stalux-category-shell:hover .stalux-category-card",
        "",
        {
            transform: "translateY(-2px)",
            "background-color": "var(--white-05p)",
            "box-shadow": "var(--card-box-shadow-hover)",
        },
    ],
    [
        ".stalux-category-shell:hover .stalux-category-card::before",
        "",
        { transform: "translateX(100%)" },
    ],
    [
        ".stalux-category-shell:hover .stalux-category-card .stalux-category-icon",
        "opacity-[1] text-ink-90",
        {
            transform: "rotate(-15deg) translateY(-2px)",
            background: "var(--accent-30p)",
            "box-shadow": "0 3px 8px var(--accent-30p)",
        },
    ],
    [".stalux-category-icon svg", "h-full w-full", {}],
];
