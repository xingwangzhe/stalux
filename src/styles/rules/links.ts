import type { StyleSpec } from "../rule-utils.ts";

export const linksStyles: StyleSpec[] = [
    [
        ".stalux-links",
        "",
        { "grid-template-columns": "repeat(5, 1fr)" },
        "@media (min-width: 1400px)",
    ],
    [
        ".stalux-links",
        "",
        { "grid-template-columns": "repeat(4, 1fr)" },
        "@media (1100px <= width <= 1399px)",
    ],
    [
        ".stalux-links",
        "",
        { "grid-template-columns": "repeat(3, 1fr)" },
        "@media (768px <= width <= 1099px)",
    ],
    [
        ".stalux-links",
        "gap-[16px]",
        { "grid-template-columns": "repeat(2, 1fr)" },
        "@media (480px <= width <= 767px)",
    ],
    [
        ".stalux-links",
        "gap-[14px] m-[20px_auto]",
        { "grid-template-columns": "1fr" },
        "@media (max-width: 479px)",
    ],
    [
        ".stalux-link-card:hover",
        "",
        {
            transform: "translateY(-3px)",
            background: "var(--white-05p)",
            "box-shadow": "var(--card-box-shadow-hover)",
        },
    ],
    [
        ".stalux-link-card-avatar img",
        "rounded-full object-cover w-[80px] h-[80px]",
        {
            border: "2px solid var(--accent-60p)",
            "transform-origin": "center",
            transition: "transform 220ms ease, border-color 220ms ease",
        },
    ],
    [
        ".stalux-link-card:hover .stalux-link-card-avatar img",
        "",
        {
            transform: "scale(1.04)",
            animation: "stalux-link-avatar-spin 700ms ease-in-out 1",
            "box-shadow": "0 0 20px var(--accent-50p)",
            "border-color": "var(--accent-85p)",
        },
    ],
    [
        ".stalux-link-card-title",
        "overflow-hidden whitespace-nowrap text-[1.1rem] m-[0_0_8px_0]",
        {
            background: "linear-gradient(90deg, var(--white-95p), var(--accent-90p))",
            "background-clip": "text",
            "-webkit-text-fill-color": "transparent",
            "text-overflow": "ellipsis",
        },
    ],
    [
        ".stalux-link-card-description",
        "m-0 overflow-hidden text-[0.95rem] leading-[1.45] text-ink-78",
        {
            display: "-webkit-box",
            "-webkit-line-clamp": "3",
            "-webkit-box-orient": "vertical",
            "text-overflow": "ellipsis",
        },
    ],
    [".stalux-link-card", "p-[14px]", {}, "@media (max-width: 480px)"],
    [".stalux-link-card-avatar img", "w-[70px] h-[70px]", {}, "@media (max-width: 480px)"],
    [".stalux-link-card-title", "text-[1rem]", {}, "@media (max-width: 480px)"],
    [".stalux-link-card-description", "text-[0.9rem]", {}, "@media (max-width: 480px)"],
    [
        ".stalux-link-card:hover .stalux-link-card-avatar img",
        "",
        { animation: "none", transform: "none", transition: "none" },
        "@media (prefers-reduced-motion: reduce)",
    ],
];
