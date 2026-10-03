import type { StyleFeature } from "./features.ts";

// Explicit ownership keeps feature CSS out of unrelated pages.
export const shortcutsByFeature: Record<StyleFeature, Record<string, string>> = {
    archives: {
        "stalux-archive-container": "max-w-[1000px] m-[0_auto] p-[var(--space-xl)_var(--space-md)]",
        "stalux-archive-year-section": "relative mb-2xl",
        "stalux-archive-year-header": "stalux-flex-row mb-6",
        "stalux-archive-year-count":
            "ml-4 text-[0.9rem] p-[0.3rem_0.8rem] bg-[var(--accent-20p)] rounded-4 text-ink-90",
        "stalux-archive-month-section":
            "relative [content-visibility:auto] [contain-intrinsic-block-size:auto_var(--archive-estimate,_600px)] ml-[calc(-1_*_var(--tl-pad))] pl-[var(--tl-pad)] mb-8",
        "stalux-archive-no-posts":
            "text-center w-full p-[3rem_1rem] text-ink-70 text-[1.2rem] bg-[var(--black-10p)] rounded-2",
        "stalux-archive-post-list":
            "list-none [content-visibility:auto] [contain-intrinsic-block-size:auto_var(--archive-group-estimate,_576px)] p-[0_0_0_var(--tl-pad)] m-[0_0_0_calc(-1_*_var(--tl-pad))]",
        "stalux-archive-post-date": "text-ink-60 text-[0.85rem] min-w-[90px]",
        "stalux-archive-post-link": "no-underline",
        "stalux-archives-archives-container": "max-w-[1000px] m-[0_auto] p-[2rem_1rem]",
    },
    categories: {
        "stalux-categories":
            "grid p-0 list-none [grid-template-columns:repeat(auto-fill,_minmax(min(300px,_100%),_1fr))] [gap:20px] m-[30px_auto] max-w-[1200px]",
        "stalux-category-card":
            "relative stalux-stack overflow-hidden h-fit p-lg bg-[var(--surface-glass)] rounded-[0.8rem] text-ink-full shadow-stalux [transition:transform_220ms_ease,_background-color_220ms_ease]",
        "stalux-category-content": "[flex:1] pr-[40px]",
        "stalux-categoryheader":
            "flex no-underline relative items-center w-full h-full text-ink-full",
        "stalux-category-icon":
            "absolute [top:10px] [right:10px] w-[28px] h-[28px] text-ink-50 [transition:transform_240ms_ease,_background-color_240ms_ease,_color_240ms_ease] z-2 [transform-origin:center_center] [background:var(--black-15p)] p-[5px] rounded-stalux-md [box-shadow:var(--shadow-sm)] [opacity:0.8]",
    },
    common: {
        "stalux-typewriter": "text-[2.5em] mt-[1.5em] stalux-glow min-h-[2em]",
        "stalux-author": "mt-[4em]",
        "stalux-author-figure-column": "",
        "stalux-footer":
            "p-[1.5rem_0] mt-auto text-[0.9rem] text-ink-full [background-color:rgba(0,_0,_0,_0.1)] [backdrop-filter:blur(10px)]",
        "stalux-footer-content": "[gap:0.8rem] max-w-[1200px] m-[0_auto] p-[0_1rem]",
        "stalux-404-error-container": "p-8 min-h-[60vh]",
        "stalux-404-home-btn":
            "inline-block no-underline p-[var(--space-md)_var(--space-lg)] [background:var(--black-20p)] text-ink-90 rounded-stalux-md [border:var(--border-thin)_solid_var(--white-20p)] [transition:background-color_var(--transition-normal),_transform_var(--transition-normal),_box-shadow_var(--transition-normal)] text-stalux-base",
        "stalux-ai-prompt":
            "absolute p-0 overflow-hidden w-[1px] h-[1px] m-[-1px] [clip:rect(0,_0,_0,_0)] [white-space:pre-wrap] [border:0]",
        "stalux-theme-info": "text-ink-70 text-[0.85rem] [gap:0.3em]",
        "stalux-stats-site-stats": "gap-2 text-[0.9rem]",
        "stalux-stats-stats-separator": "[color:rgba(255,_255,_255,_0.5)]",
        "stalux-stats-site-build-time": "mt-2 text-[0.9rem] [color:rgba(255,_255,_255,_0.8)]",
        "stalux-copyright": "text-ink-70 [font-weight:500] [gap:0.3em]",
        "stalux-beian-beian-info": "gap-4",
        "stalux-beian-public-security-beian":
            "inline-flex no-underline [gap:5px] [color:rgba(255,_255,_255,_0.7)] [transition:color_0.3s_ease] text-[0.9rem]",
        "stalux-badges-wrapper": "gap-2",
        "stalux-badge-group": "[border:none]",
        "stalux-badge-group-summary":
            "cursor-pointer list-none [gap:0.4rem] p-[0.2rem_0] text-ink-70 text-[0.85rem] [user-select:none] [transition:color_0.2s]",
        "stalux-badge-group-arrow": "inline-block text-[0.65rem] [transition:transform_0.2s]",
        "stalux-badge-group-title": "text-ink-80",
        "stalux-badge-group-hint": "text-[0.7rem] text-ink-70",
        "stalux-badge-group-items": "pt-[0.35rem]",
        "stalux-badges": "gap-2",
        "stalux-badge": "w-auto",
        "stalux-nav-container": "relative max-w-full overflow-hidden box-border",
        "stalux-nav-list":
            "max-w-full box-border gap-8 [transform:scale(var(--nav-scale,_1))] [transform-origin:center] [transition:transform_220ms_cubic-bezier(0.22,_0.72,_0.22,_1)] [overflow:visible]",
        "stalux-nav-scroll-btn":
            "hidden absolute rounded-full cursor-pointer pointer-events-none p-0 [top:50%] [transform:translateY(-50%)] z-10 w-[36px] h-[36px] [border:none] [background:var(--black-30p)] [backdrop-filter:blur(8px)] text-ink-full opacity-0 [transition:opacity_0.25s_ease] [box-shadow:var(--shadow-md)]",
        "stalux-nav-item": "shrink-0 text-[1.3em] mr-[1em] ml-[1em] stalux-glow",
        "stalux-nav-text": "whitespace-nowrap text-ink-full",
        "stalux-nav-toggle":
            "hidden text-inherit cursor-pointer [background:none] [border:none] p-3 z-[1001] min-w-[48px] min-h-[48px]",
        "stalux-nav-overlay":
            "hidden fixed h-full pointer-events-none top-0 left-0 [background:rgba(0,_0,_0,_0.6)] z-[999] opacity-0 [transition:opacity_0.3s_ease]",
        "stalux-page-title": "stalux-glow mt-[1.5em] text-[2.5em]",
        "stalux-page-description": "mb-[1.5em] text-[1.2em] text-ink-60",
        "stalux-home-body": "min-h-screen relative pb-3xl",
        "stalux-home-title": "text-[4em] mt-[1.5em] stalux-glow text-ink-full",
        "stalux-home-navs": "max-w-full [order:-1]",
        "stalux-card-post-title": "m-0 leading-[1.35] [overflow-wrap:anywhere]",
        "stalux-card-post-description": "text-ink-70 leading-[1.6] [overflow-wrap:anywhere]",
        "stalux-post-card":
            "box-border cursor-pointer h-full bg-[var(--card-bg)] rounded-stalux-lg shadow-stalux p-lg [transition:transform_220ms_cubic-bezier(0.22,_0.72,_0.22,_1)] gap-lg",
        "stalux-card-post-cover": "overflow-hidden shrink-0 h-[180px] rounded-stalux-md mb-2",
        "stalux-card-post-meta": "[gap:0.6rem]",
        "stalux-card-time": "inline-flex [gap:0.45rem]",
        "stalux-card-post-tags": "[gap:0.4rem]",
        "stalux-card-post-tag":
            "inline-block p-[0.22rem_0.7rem] rounded-full [background:var(--tag-bg)] [color:#fff] text-[0.85rem] leading-none",
        "stalux-card-post-categories": "[gap:0.4rem]",
        "stalux-card-post-category":
            "inline-block p-[0.18rem_0.5rem] rounded-[6px] [background:var(--category-bg)] [color:#fff] text-[0.84rem] leading-none",
        "stalux-card-read-more": "mt-[0.6rem] [align-self:flex-start]",
        "stalux-u-flex": "flex",
        "stalux-u-items-center": "items-center",
        "stalux-u-justify-center": "justify-center",
        "stalux-u-flex-wrap": "flex-wrap",
        "stalux-u-flex-col": "flex-col",
        "stalux-u-w-full": "w-full",
        "stalux-u-min-w-0": "min-w-0",
        "stalux-u-text-center": "text-center",
    },
    links: {
        "stalux-links":
            "grid box-border w-full p-[0_1rem] list-none [grid-template-columns:repeat(auto-fill,_minmax(min(180px,_100%),_1fr))] [gap:20px] m-[30px_auto] max-w-[1600px]",
        "stalux-link-list-item": "flex min-w-0 w-full",
        "stalux-link-card":
            "stalux-stack no-underline stalux-glass rounded-[10px] p-[16px] [color:#fff] min-h-[200px] box-border w-full min-w-0 [overflow:visible] [transition:transform_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease] shadow-stalux",
        "stalux-link-card-avatar": "flex justify-center mb-[12px]",
        "stalux-link-card-content": "text-center stalux-stack [flex:1]",
    },
    article: {
        "stalux-random-container":
            "[transition:background-color_0.3s_ease,_border-color_0.3s_ease]",
        "stalux-random-header":
            "flex justify-between items-center mb-[1em] pb-[0.75em] [border-bottom:2px_solid_rgba(0,_0,_0,_0.05)]",
        "stalux-random-title": "m-0 font-semibold text-[1.1em] text-[var(--foreground-60p,_#333)]",
        "stalux-random-refresh":
            "stalux-flex-center p-0 cursor-pointer w-[2em] h-[2em] [border:none] rounded-[0.375em] [background:transparent] text-[var(--foreground-60p,_#333)] [transition:color_0.2s_ease]",
        "stalux-random-list":
            "stalux-list-reset stalux-stack [gap:0.75em] [transition:opacity_0.3s_ease]",
        "stalux-random-error": "text-[var(--accent-60p,_#e74c3c)]",
        "stalux-toc-title":
            "font-semibold m-[0_0_var(--space-xs)] text-stalux-base text-ink-90 pb-sm [border-bottom:var(--border-thin)_solid_var(--white-20p)]",
        "stalux-toc-list": "stalux-list-reset stalux-stack gap-sm",
        "stalux-toc-item":
            "block no-underline p-[var(--space-sm)_var(--space-xs)] text-ink-70 text-stalux-small [border-left:var(--border-thick)_solid_transparent] rounded-[0_var(--radius-sm)_var(--radius-sm)_0] [transition:color_var(--transition-medium),_background-color_var(--transition-medium),_border-left-color_var(--transition-medium),_transform_var(--transition-medium)] leading-[1.4] [word-break:break-word]",
        "stalux-toc-empty": "text-ink-60 text-stalux-small",
        "stalux-post-taxonomy-container": "stalux-stack gap-xs",
        "stalux-post-taxonomy-title":
            "m-0 font-semibold text-stalux-base text-ink-90 pb-sm [border-bottom:var(--border-thin)_solid_var(--white-20p)]",
        "stalux-post-taxonomy-list-column": "flex-col",
        "stalux-post-taxonomy-item-column":
            "inline-flex no-underline p-[var(--space-sm)_var(--space-xs)] [background:var(--white-05p)] text-ink-80 [border-left:var(--border-thick)_solid_var(--accent-60p)] [transition:color_var(--transition-medium),_transform_var(--transition-medium)] rounded-[0_var(--radius-sm)_var(--radius-sm)_0] text-stalux-small [transform:translateX(0)]",
        "stalux-post-taxonomy-list-wrap": "flex-wrap",
        "stalux-post-taxonomy-item-pill":
            "inline-block no-underline whitespace-nowrap p-[0.4rem_0.8rem] [background:var(--white-10p)] [border:none] rounded-stalux-full text-stalux-smaller [transition:color_var(--transition-medium),_transform_var(--transition-medium)] [transform:translateY(0)] text-ink-85",
        "stalux-post-taxonomy-empty":
            "text-center text-ink-50 text-stalux-small p-[var(--space-md)_0]",
        "stalux-sidebar-right": "[scroll-padding-bottom:8rem]",
        "stalux-sidebar-container":
            "stalux-stack stalux-glass [box-shadow:var(--surface-glass-shadow)] rounded-[14px] p-md [transition:box-shadow_220ms_ease,_background-color_220ms_ease]",
        "stalux-pagination":
            "w-full m-[var(--space-lg)_0] [border-top:var(--border-thin)_solid_var(--white-20p)] [border-bottom:var(--border-thin)_solid_var(--white-20p)] pt-lg pb-lg",
        "stalux-pagination-inner": "flex justify-between gap-md",
        "stalux-pagination-link":
            "stalux-flex-row no-underline min-w-0 relative box-border gap-sm p-md [background:var(--black-10p)] rounded-stalux-md text-ink-90 [outline:1px_solid_var(--white-10p)] [outline-offset:0] [transition:background-color_180ms_ease,_outline-color_180ms_ease] [box-shadow:var(--shadow-sidebar)] [flex:1_1_0]",
        "stalux-pagination-content": "stalux-stack min-w-0 overflow-hidden",
        "stalux-pagination-arrow":
            "shrink-0 stalux-flex-center text-ink-70 [transition:translate_180ms_ease]",
        "stalux-pagination-label":
            "text-stalux-small text-[var(--accent-90p)] mb-xs [font-weight:500]",
        "stalux-pagination-title":
            "whitespace-nowrap overflow-hidden max-w-full text-stalux-base [text-overflow:ellipsis] text-ink-90",
        "stalux-post-page": "w-full min-h-screen stalux-stack",
        "stalux-post-layout":
            "grid w-full box-border [flex:1] [grid-template-columns:280px_minmax(0,_1fr)_280px] gap-6 max-w-[1920px] min-w-0 m-[0_auto] p-[1.5rem_1rem]",
        "stalux-article":
            "w-full min-h-screen stalux-stack box-border [flex:1] stalux-glass [box-shadow:var(--surface-glass-shadow)] rounded-[18px] min-w-0 max-w-full p-[clamp(1rem,_2vw,_2rem)]",
        "stalux-post-article-header":
            "mb-12 pb-8 [border-bottom:1px_solid_var(--white-10p)] [animation:stalux-post-content-reveal_220ms_ease_360ms_both]",
        "stalux-post-title":
            "font-bold text-center text-10 text-ink-full m-[0_0_1.5rem] leading-[1.2] [word-break:break-word] stalux-glow",
        "stalux-post-metadata":
            "flex flex-wrap justify-center gap-6 text-[0.95rem] [color:#ffffffb3]",
        "stalux-post-meta-item":
            "inline-flex items-center gap-2 [transition:color_var(--transition-fast)]",
        "stalux-post-page-stats":
            "flex justify-center items-center mt-4 pt-[0.8rem] [border-top:1px_solid_var(--white-10p)] text-[0.9rem] [color:#ffffffb3] gap-4",
        "stalux-post-reading-time": "inline-flex items-center [gap:0.3rem]",
        "stalux-post-meta-row": "flex justify-center [flex-basis:100%]",
        "stalux-post-body":
            "max-w-full box-border [flex:1] min-w-0 w-[min(1200px,_100%)] m-[0_auto] p-[0_0_2rem] [animation:stalux-post-content-reveal_220ms_ease_360ms_both]",
        "stalux-post-source-link-row": "flex justify-center mt-[1.2rem]",
        "stalux-post-source-link":
            "inline-flex items-center no-underline [gap:0.4rem] p-[0.5rem_1.1rem] text-[0.85rem] [font-weight:500] text-ink-full [background:var(--white-10p)] [border-top:1px_solid_var(--white-20p)] [border-right:1px_solid_var(--white-20p)] [border-left:1px_solid_var(--white-20p)] [border-bottom:0] rounded-[var(--radius-full,_999px)] [transition:background_var(--transition-fast),_transform_var(--transition-fast)]",
        "stalux-post-article-footer":
            "mt-12 pt-8 [border-top:1px_solid_var(--white-10p)] [animation:stalux-post-content-reveal_220ms_ease_360ms_both]",
        "stalux-post-footer-content": "stalux-stack gap-lg",
        "stalux-license-box":
            "relative overflow-hidden bg-[var(--black-10p)] p-lg rounded-stalux-md [border:var(--border-thin)_solid_var(--white-20p)] max-w-[80%] m-[var(--space-lg)_auto]",
        "stalux-license-content": "relative z-2",
        "stalux-license-title": "mt-0 mb-sm text-stalux-subtitle text-ink-90",
        "stalux-license-watermark":
            "absolute pointer-events-none bottom-2 right-2 [opacity:0.15] z-1 [transition:opacity_var(--transition-normal)]",
        "stalux-license-icon": "stalux-flex-center w-[120px] h-[120px]",
        "stalux-byline-sidebar-container": "stalux-stack gap-lg",
        "stalux-byline-author-section": "w-full",
        "stalux-byline-author-card":
            "stalux-stack [background:var(--black-05p)] rounded-stalux-lg p-md shadow-stalux",
        "stalux-byline-author-bio":
            "text-center w-full text-stalux-small text-ink-70 m-[var(--space-md)_0_0] leading-[1.6] pt-md [border-top:var(--border-thin)_solid_var(--white-10p)]",
    },
    tags: {
        "stalux-cloud-cards": "block box-border p-4",
        "stalux-cloud-tag-group":
            "flex flex-wrap justify-center items-start gap-3 mb-3 [content-visibility:auto] [contain-intrinsic-block-size:auto_24rem] [overflow-clip-margin:30px]",
        "stalux-cloud-canvas-frame": "[container-type:inline-size]",
        "stalux-cloud-tag-card":
            "relative stalux-flex-row no-underline overflow-hidden p-[0.5rem_1rem] rounded-8 bg-ink-05 text-ink-full [border:1px_solid_var(--white-20p)] [transition:transform_var(--transition-slow),_border-color_var(--transition-slow)]",
        "stalux-cloud-tag-name": "mr-2 z-2",
        "stalux-cloud-tag-count":
            "text-center bg-ink-20 rounded-4 p-[0.1rem_0.4rem] text-[0.8rem] min-w-6 z-2",
        "stalux-cloud-no-tags": "text-center w-full text-[1.2rem] text-ink-60 p-8",
    },
    words: {
        "stalux-word-list-list": "stalux-stack items-center p-0 list-none gap-6 m-[2rem_auto]",
        "stalux-word-list-item": "w-full flex max-w-[900px]",
        "stalux-word-card":
            "w-full box-border stalux-stack stalux-glass rounded-[var(--radius-lg,_12px)] p-6 shadow-stalux [transition:transform_var(--transition-normal),_box-shadow_var(--transition-normal)] gap-3",
        "stalux-word-body": "text-ink-80 leading-[1.7] text-[1.05rem]",
        "stalux-word-footer":
            "flex justify-between items-center mt-auto pt-3 [border-top:1px_solid_var(--white-10p)] gap-4 text-[0.9rem] text-ink-60",
        "stalux-word-date": "[font-variant-numeric:tabular-nums] text-ink-50",
        "stalux-word-source-meta": "stalux-flex-row flex-wrap gap-2 justify-end",
        "stalux-word-source-date": "italic text-ink-50",
        "stalux-word-source-text": "italic",
        "stalux-word-source-link":
            "underline italic text-[var(--accent-80p)] [text-decoration-color:var(--accent-50p)] [text-underline-offset:0.15em] [transition:color_var(--transition-fast)]",
    },
};

export const componentShortcuts = Object.assign({}, ...Object.values(shortcutsByFeature)) as Record<
    string,
    string
>;
export const shortcutGroups = Object.fromEntries(
    Object.entries(shortcutsByFeature).flatMap(([feature, shortcuts]) =>
        Object.keys(shortcuts).map((name) => [name, feature as StyleFeature]),
    ),
);
