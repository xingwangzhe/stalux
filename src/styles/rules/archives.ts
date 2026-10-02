import type { StyleSpec } from "../rule-utils.ts";

export const archivesStyles: StyleSpec[] = [
    [
        ".stalux-archive-timeline-container",
        "relative pl-[var(--tl-pad)]",
        { "--tl-line": "var(--radius-sm)", "--tl-pad": "var(--space-xl)" },
    ],
    [
        ".stalux-archive-timeline-container::before",
        "absolute h-full left-[0] top-[0] w-[var(--tl-line)] rounded-[var(--border-medium)]",
        {
            content: '""',
            background:
                "linear-gradient( to bottom, var(--accent-80p), var(--accent-40p), var(--white-20p) )",
        },
    ],
    [
        ".stalux-archive-year-title",
        "relative m-0 text-[1.8rem]",
        { "--dot": "16px", color: "var(--accent-90p)" },
    ],
    [
        ".stalux-archive-year-title::before",
        "absolute box-border rounded-full w-[var(--dot)] h-[var(--dot)] left-[calc(var(--tl-line)_/_2_-_var(--tl-pad)_-_var(--dot)_/_2)] top-[50%] z-[2]",
        {
            content: '""',
            "background-color": "var(--accent-80p)",
            border: "3px solid var(--white-30p)",
            transform: "translateY(-50%)",
        },
    ],
    [
        ".stalux-archive-post-item",
        "flex items-center relative mb-[1rem] p-[0.35rem_0] gap-[0.75rem]",
        { "--dot": "6px" },
    ],
    [
        ".stalux-archive-month-section, .stalux-archive-post-list",
        "",
        { "contain-intrinsic-block-size": "auto" },
        "@supports not (content-visibility: auto)",
    ],
    [
        ".stalux-archive-post-item::before",
        "absolute box-border rounded-full w-[var(--dot)] h-[var(--dot)] left-[calc(var(--tl-line)_/_2_-_var(--tl-pad)_-_var(--dot)_/_2)] top-[50%] z-[1]",
        { content: '""', "background-color": "var(--white-60p)", transform: "translateY(-50%)" },
    ],
    [".stalux-archive-month-title", "relative text-[1rem] m-[0_0_0.25rem_0]", { "--dot": "10px" }],
    [
        ".stalux-archive-month-title::before",
        "absolute box-border rounded-full w-[var(--dot)] h-[var(--dot)] left-[calc(var(--tl-line)_/_2_-_var(--tl-pad)_-_var(--dot)_/_2)] top-[50%] z-[1]",
        {
            content: '""',
            "background-color": "rgba(255, 255, 255, 0.6)",
            transform: "translateY(-50%)",
        },
    ],
    [".stalux-archive-container", "p-[1.5rem_0.5rem_2rem_1.5rem]", {}, "@media (max-width: 768px)"],
    [".stalux-archive-page-header", "mb-[2rem]", {}, "@media (max-width: 768px)"],
    [
        ".stalux-archive-timeline-container",
        "",
        { "--tl-pad": "1.5rem" },
        "@media (max-width: 768px)",
    ],
    [".stalux-archive-year-section", "mb-[2rem]", {}, "@media (max-width: 768px)"],
    [
        ".stalux-archive-year-title",
        "text-[1.6rem]",
        { "--dot": "14px" },
        "@media (max-width: 768px)",
    ],
    [".stalux-archive-month-title", "text-[1.2rem]", {}, "@media (max-width: 768px)"],
    [".stalux-archive-container", "p-[1.5rem_0.5rem_2rem_1.2rem]", {}, "@media (max-width: 480px)"],
    [
        ".stalux-archive-timeline-container",
        "",
        { "--tl-pad": "1.2rem", "--tl-line": "3px" },
        "@media (max-width: 480px)",
    ],
    [
        ".stalux-archive-year-title",
        "text-[1.4rem]",
        { "--dot": "12px" },
        "@media (max-width: 480px)",
    ],
    [".stalux-archive-month-title", "text-[1.1rem]", {}, "@media (max-width: 480px)"],
];
