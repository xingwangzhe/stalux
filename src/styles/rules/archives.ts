import type { StyleSpec } from "../rule-utils.ts";

export const archivesStyles: StyleSpec[] = [
    [
        ".stalux-archive-description",
        "fixed box-border p-4 rounded-3",
        {
            "z-index": "10000",
            inset: "auto",
            margin: "0",
            width: "min(320px, calc(100vw - 32px))",
            "max-height": "min(320px, calc(100vh - 32px))",
            "overflow-y": "auto",
            "overflow-wrap": "anywhere",
            "line-height": "1.65",
            "font-size": "0.9rem",
            color: "var(--white-90p)",
            background: "rgb(24 24 27 / 0.96)",
            border: "1px solid var(--accent-40p)",
            "box-shadow": "var(--shadow-sidebar)",
        },
    ],
    [".stalux-archive-description[hidden]", "hidden", {}],
    [".stalux-archive-description", "hidden", {}, "@media print"],
    [
        ".stalux-archive-timeline-container",
        "relative pl-[var(--tl-pad)]",
        { "--tl-line": "3px", "--tl-pad": "var(--space-xl)" },
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
        "relative m-0 text-[1.8rem] leading-[1.35]",
        { "--dot": "16px", color: "var(--accent-90p)" },
    ],
    [
        ".stalux-archive-year-title::before",
        "absolute box-border rounded-full w-[var(--dot)] h-[var(--dot)] left-[calc(var(--tl-line)_/_2_-_var(--tl-pad)_-_var(--dot)_/_2)] top-[0.675em] z-[2]",
        {
            content: '""',
            "background-color": "var(--accent-80p)",
            border: "3px solid var(--white-30p)",
            transform: "translateY(-50%)",
        },
    ],
    [
        ".stalux-archive-post-item",
        "grid items-start relative mb-[0.6rem] p-[0.4rem_0] gap-[0.75rem]",
        { "--dot": "6px", "grid-template-columns": "100px minmax(0, 1fr)", "line-height": "1.65" },
    ],
    [
        ".stalux-archive-month-section, .stalux-archive-post-list",
        "",
        { "contain-intrinsic-block-size": "auto" },
        "@supports not (content-visibility: auto)",
    ],
    [
        ".stalux-archive-post-item::before",
        "absolute box-border rounded-full w-[var(--dot)] h-[var(--dot)] left-[calc(var(--tl-line)_/_2_-_var(--tl-pad)_-_var(--dot)_/_2)] top-[calc(0.4rem_+_0.825rem)] z-[1]",
        { content: '""', "background-color": "var(--white-60p)", transform: "translateY(-50%)" },
    ],
    [
        ".stalux-archive-month-title",
        "relative text-[1.05rem] leading-[1.5] m-[0_0_0.6rem_0]",
        { "--dot": "10px", "font-weight": "600", color: "var(--white-90p)" },
    ],
    [
        ".stalux-archive-month-title::before",
        "absolute box-border rounded-full w-[var(--dot)] h-[var(--dot)] left-[calc(var(--tl-line)_/_2_-_var(--tl-pad)_-_var(--dot)_/_2)] top-[0.75em] z-[1]",
        {
            content: '""',
            "background-color": "rgb(255 255 255 / 0.6)",
            transform: "translateY(-50%)",
        },
    ],
    [
        ".stalux-archive-post-link",
        "min-w-0 max-w-full justify-self-start",
        { "overflow-wrap": "anywhere", transition: "color 160ms ease", "border-radius": "3px" },
    ],
    [
        ".stalux-archive-post-link:hover",
        "",
        {
            color: "var(--accent-90p)",
            "text-decoration": "none",
            "text-underline-offset": "4px",
        },
    ],
    [
        ".stalux-archive-post-link:focus-visible",
        "",
        { outline: "2px solid var(--accent-90p)", "outline-offset": "4px" },
    ],
    [
        ".stalux-archive-post-date",
        "",
        {
            "font-variant-numeric": "tabular-nums",
            "white-space": "nowrap",
            "line-height": "1.65rem",
        },
    ],
    [
        ".stalux-archive-post-item",
        "gap-[0.1rem]",
        { "grid-template-columns": "minmax(0, 1fr)" },
        "@media (max-width: 600px)",
    ],
    [
        ".stalux-archive-month-section, .stalux-archive-post-list",
        "",
        { "content-visibility": "visible", "contain-intrinsic-block-size": "none" },
        "@media print",
    ],
    [
        ".stalux-archive-post-link",
        "",
        { transition: "none" },
        "@media (prefers-reduced-motion: reduce)",
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
