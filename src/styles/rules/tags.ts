import type { StyleSpec } from "../rule-utils.ts";

export const tagsStyles: StyleSpec[] = [
    [
        ".stalux-cloud-tag-group",
        "",
        { "contain-intrinsic-block-size": "auto" },
        "@supports not (content-visibility: auto)",
    ],
    [".stalux-cloud-cards", "hidden", {}, "@media (min-width: 769px)"],
    [
        ".stalux-cloud-canvas",
        "relative hidden w-full h-[min(calc(var(--cloud-base-diameter)_*_var(--cloud-density)),_120cqw)] min-h-[520px]",
        { "--cloud-base-diameter": "660px" },
    ],
    [".stalux-cloud-canvas", "block", {}, "@media (min-width: 769px)"],
    [
        ".stalux-cloud-tag-card::before",
        "absolute z-[1]",
        {
            content: '""',
            inset: "0",
            background:
                "linear-gradient( 120deg, rgba(255, 255, 255, 0), var(--white-10p), rgba(255, 255, 255, 0) )",
            transform: "translateX(-100%)",
            transition: "transform var(--transition-slowest)",
        },
    ],
    [
        ".stalux-cloud-tag-card:hover",
        "",
        {
            transform: "translateY(-2px)",
            "border-color": "var(--accent-50p)",
            "box-shadow": "var(--card-box-shadow-hover)",
        },
    ],
    [".stalux-cloud-tag-card:hover::before", "", { transform: "translateX(100%)" }],
    ['.stalux-cloud-tag-card[data-count="1"]', "text-[0.9rem] p-[0.3rem_0.8rem]", {}],
    ['.stalux-cloud-tag-card[data-count="2"]', "text-[1rem] p-[0.4rem_0.9rem]", {}],
    ['.stalux-cloud-tag-card[data-count="3"]', "text-[1.1rem] p-[0.5rem_1rem]", {}],
    [
        '.stalux-cloud-tag-card[data-count^="4"], .stalux-cloud-tag-card[data-count^="5"]',
        "text-[1.2rem] p-[0.6rem_1.1rem]",
        {},
    ],
    [
        '.stalux-cloud-tag-card[data-count^="6"], .stalux-cloud-tag-card[data-count^="7"], .stalux-cloud-tag-card[data-count^="8"], .stalux-cloud-tag-card[data-count^="9"]',
        "text-[1.3rem] p-[0.7rem_1.2rem]",
        {},
    ],
    [
        ".stalux-cloud-canvas",
        "",
        { "--cloud-base-diameter": "840px" },
        "@media (min-width: 1024px)",
    ],
    [
        ".stalux-cloud-canvas",
        "",
        { "--cloud-base-diameter": "960px" },
        "@media (min-width: 1440px)",
    ],
    [
        ".stalux-tag-header",
        "relative m-[3em] mb-[2.5rem] pb-[1rem]",
        { "border-bottom": "1px solid var(--white-10p)" },
    ],
    [
        ".stalux-tag-header .stalux-tag-page-title",
        "flex items-center text-[1.8rem] mb-[0.5rem] text-ink-full",
        {},
    ],
    [
        ".stalux-tag-header .stalux-tag-page-title .stalux-tag-category-icon",
        "mr-[0.8rem]",
        { color: "var(--accent-80p)" },
    ],
    [
        ".stalux-tag-header .stalux-tag-page-title .stalux-tag-category-name",
        "",
        { color: "var(--accent-90p)", "font-weight": "500" },
    ],
    [".stalux-tag-header .stalux-tag-page-description", "text-[1rem] mb-[0.5rem] text-ink-70", {}],
    [
        ".stalux-tag-header .stalux-tag-back-link",
        "inline-block no-underline text-[0.9rem] text-ink-60",
        { transition: "color var(--transition-fast) ease" },
    ],
    [".stalux-tag-header .stalux-tag-back-link:hover", "", { color: "var(--accent-90p)" }],
];
