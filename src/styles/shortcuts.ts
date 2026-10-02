// Stable component names are UnoCSS shortcuts. Layout/state selectors stay in theme CSS.
export const componentShortcuts = {
    "stalux-archive-container":
        "[max-width:1000px] [margin:0_auto] [padding:var(--space-xl)_var(--space-md)]",
    "stalux-archive-year-section": "relative [margin-bottom:var(--space-2xl)]",
    "stalux-archive-year-header": "stalux-flex-row [margin-bottom:1.5rem]",
    "stalux-archive-year-count":
        "[margin-left:1rem] [font-size:0.9rem] [padding:0.3rem_0.8rem] [background-color:var(--accent-20p)] [border-radius:1rem] text-ink-90",
    "stalux-archive-month-section":
        "relative [content-visibility:auto] [contain-intrinsic-block-size:auto_var(--archive-estimate,_600px)] [margin-left:calc(-1_*_var(--tl-pad))] [padding-left:var(--tl-pad)] [margin-bottom:2rem]",
    "stalux-archive-no-posts":
        "text-center w-full [padding:3rem_1rem] text-ink-70 [font-size:1.2rem] [background-color:var(--black-10p)] [border-radius:0.5rem]",
    "stalux-archive-post-list":
        "list-none [content-visibility:auto] [contain-intrinsic-block-size:auto_var(--archive-group-estimate,_576px)] [padding:0_0_0_var(--tl-pad)] [margin:0_0_0_calc(-1_*_var(--tl-pad))]",
    "stalux-archive-post-date": "text-ink-60 [font-size:0.85rem] [min-width:90px]",
    "stalux-archive-post-link": "no-underline",
    "stalux-categories":
        "grid p-0 list-none [grid-template-columns:repeat(auto-fill,_minmax(300px,_1fr))] [gap:20px] [margin:30px_auto] [max-width:1200px]",
    "stalux-category-card":
        "relative stalux-stack overflow-hidden h-fit p-lg [background-color:var(--surface-glass)] [border-radius:0.8rem] text-ink-full [box-shadow:var(--card-box-shadow)] [transition:transform_220ms_ease,_background-color_220ms_ease]",
    "stalux-category-content": "[flex:1] [padding-right:40px]",
    "stalux-categoryheader": "flex no-underline relative items-center w-full h-full text-ink-full",
    "stalux-category-icon":
        "absolute [top:10px] [right:10px] [width:28px] [height:28px] text-ink-50 [transition:transform_240ms_ease,_background-color_240ms_ease,_color_240ms_ease] [z-index:2] [transform-origin:center_center] [background:var(--black-15p)] [padding:5px] [border-radius:var(--radius-md)] [box-shadow:var(--shadow-sm)] [opacity:0.8]",
    "stalux-typewriter":
        "text-center flex justify-center w-full [font-size:2.5em] [margin-top:1.5em] stalux-glow [min-height:2em]",
    "stalux-author": "stalux-stack justify-center [margin-top:4em]",
    "stalux-author-figure-column": "flex-col",
    "stalux-footer":
        "w-full text-center [padding:1.5rem_0] [margin-top:auto] [font-size:0.9rem] text-ink-full [background-color:rgba(0,_0,_0,_0.1)] [backdrop-filter:blur(10px)]",
    "stalux-footer-content":
        "stalux-stack [gap:0.8rem] [max-width:1200px] [margin:0_auto] [padding:0_1rem]",
    "stalux-404-error-container": "text-center stalux-flex-center [padding:2rem] [min-height:60vh]",
    "stalux-404-home-btn":
        "inline-block no-underline [padding:var(--space-md)_var(--space-lg)] [background:var(--black-20p)] text-ink-90 [border-radius:var(--radius-md)] [border:var(--border-thin)_solid_var(--white-20p)] [transition:background-color_var(--transition-normal),_transform_var(--transition-normal),_box-shadow_var(--transition-normal)] [font-size:var(--font-size-base)]",
    "stalux-ai-prompt":
        "absolute p-0 overflow-hidden [width:1px] [height:1px] [margin:-1px] [clip:rect(0,_0,_0,_0)] [white-space:pre-wrap] [border:0]",
    "stalux-theme-info":
        "flex justify-center flex-wrap text-ink-70 [font-size:0.85rem] [gap:0.3em]",
    "stalux-stats-site-stats": "flex justify-center flex-wrap [gap:0.5rem] [font-size:0.9rem]",
    "stalux-stats-stats-separator": "[color:rgba(255,_255,_255,_0.5)]",
    "stalux-stats-site-build-time":
        "text-center [margin-top:0.5rem] [font-size:0.9rem] [color:rgba(255,_255,_255,_0.8)]",
    "stalux-copyright": "flex justify-center flex-wrap text-ink-70 [font-weight:500] [gap:0.3em]",
    "stalux-beian-beian-info": "flex justify-center flex-wrap [gap:1rem]",
    "stalux-beian-public-security-beian":
        "inline-flex items-center no-underline [gap:5px] [color:rgba(255,_255,_255,_0.7)] [transition:color_0.3s_ease] [font-size:0.9rem]",
    "stalux-badges-wrapper": "flex justify-center items-center flex-wrap [gap:0.5rem]",
    "stalux-badge-group": "w-full [border:none]",
    "stalux-badge-group-summary":
        "cursor-pointer flex justify-center items-center list-none [gap:0.4rem] [padding:0.2rem_0] text-ink-70 [font-size:0.85rem] [user-select:none] [transition:color_0.2s]",
    "stalux-badge-group-arrow": "inline-block [font-size:0.65rem] [transition:transform_0.2s]",
    "stalux-badge-group-title": "text-ink-80",
    "stalux-badge-group-hint": "[font-size:0.7rem] text-ink-70",
    "stalux-badge-group-items": "[padding-top:0.35rem]",
    "stalux-badges": "flex justify-center items-center flex-wrap [gap:0.5rem]",
    "stalux-badge": "[width:auto]",
    "stalux-nav-container": "relative w-full min-w-0 max-w-full overflow-hidden box-border",
    "stalux-nav-list":
        "stalux-flex-center min-w-0 max-w-full box-border flex-wrap w-full [gap:2rem] [transform:scale(var(--nav-scale,_1))] [transform-origin:center] [transition:transform_220ms_cubic-bezier(0.22,_0.72,_0.22,_1)] [overflow:visible]",
    "stalux-nav-scroll-btn":
        "hidden absolute rounded-full cursor-pointer items-center justify-center pointer-events-none p-0 [top:50%] [transform:translateY(-50%)] [z-index:10] [width:36px] [height:36px] [border:none] [background:var(--black-30p)] [backdrop-filter:blur(8px)] text-ink-full [opacity:0] [transition:opacity_0.25s_ease] [box-shadow:var(--shadow-md)]",
    "stalux-nav-item":
        "stalux-flex-row shrink-0 [font-size:1.3em] [margin-right:1em] [margin-left:1em] stalux-glow",
    "stalux-nav-text": "whitespace-nowrap text-ink-full",
    "stalux-nav-toggle":
        "hidden text-inherit cursor-pointer [background:none] [border:none] [padding:0.75rem] [z-index:1001] [min-width:48px] [min-height:48px]",
    "stalux-nav-overlay":
        "hidden fixed w-full h-full pointer-events-none [top:0] [left:0] [background:rgba(0,_0,_0,_0.6)] [z-index:999] [opacity:0] [transition:opacity_0.3s_ease]",
    "stalux-links":
        "grid p-0 list-none [grid-template-columns:repeat(auto-fill,_minmax(180px,_1fr))] [gap:20px] [margin:30px_auto] [max-width:1200px] [justify-items:center]",
    "stalux-link-list-item": "flex",
    "stalux-link-card":
        "stalux-stack no-underline stalux-glass [border-radius:10px] [padding:16px] [color:#fff] [min-height:200px] [width:180px] [overflow:visible] [transition:transform_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease] [box-shadow:var(--card-box-shadow)]",
    "stalux-link-card-avatar": "flex justify-center [margin-bottom:12px]",
    "stalux-link-card-content": "text-center stalux-stack [flex:1]",
    "stalux-page-title": "text-center stalux-glow [margin-top:1.5em] [font-size:2.5em]",
    "stalux-page-description": "text-center [margin-bottom:1.5em] [font-size:1.2em] text-ink-60",
    "stalux-home-body":
        "stalux-stack items-center min-h-screen relative [padding-bottom:var(--space-3xl)]",
    "stalux-home-title": "text-center [font-size:4em] [margin-top:1.5em] stalux-glow text-ink-full",
    "stalux-home-navs": "flex w-full min-w-0 max-w-full justify-center [order:-1]",
    "stalux-archives-archives-container": "[max-width:1000px] [margin:0_auto] [padding:2rem_1rem]",
    "stalux-random-container": "[transition:background-color_0.3s_ease,_border-color_0.3s_ease]",
    "stalux-random-header":
        "flex justify-between items-center [margin-bottom:1em] [padding-bottom:0.75em] [border-bottom:2px_solid_rgba(0,_0,_0,_0.05)]",
    "stalux-random-title":
        "m-0 font-semibold [font-size:1.1em] [color:var(--foreground-60p,_#333)]",
    "stalux-random-refresh":
        "stalux-flex-center p-0 cursor-pointer [width:2em] [height:2em] [border:none] [border-radius:0.375em] [background:transparent] [color:var(--foreground-60p,_#333)] [transition:color_0.2s_ease]",
    "stalux-random-list":
        "stalux-list-reset stalux-stack [gap:0.75em] [transition:opacity_0.3s_ease]",
    "stalux-random-error": "[color:var(--accent-60p,_#e74c3c)]",
    "stalux-toc-title":
        "font-semibold [margin:0_0_var(--space-xs)] [font-size:var(--font-size-base)] text-ink-90 [padding-bottom:var(--space-sm)] [border-bottom:var(--border-thin)_solid_var(--white-20p)]",
    "stalux-toc-list": "stalux-list-reset stalux-stack [gap:var(--space-sm)]",
    "stalux-toc-item":
        "block no-underline [padding:var(--space-sm)_var(--space-xs)] text-ink-70 [font-size:var(--font-size-small)] [border-left:var(--border-thick)_solid_transparent] [border-radius:0_var(--radius-sm)_var(--radius-sm)_0] [transition:color_var(--transition-medium),_background-color_var(--transition-medium),_border-left-color_var(--transition-medium),_transform_var(--transition-medium)] [line-height:1.4] [word-break:break-word]",
    "stalux-toc-empty": "text-ink-60 [font-size:var(--font-size-small)]",
    "stalux-post-taxonomy-container": "stalux-stack [gap:var(--space-xs)]",
    "stalux-post-taxonomy-title":
        "m-0 font-semibold [font-size:var(--font-size-base)] text-ink-90 [padding-bottom:var(--space-sm)] [border-bottom:var(--border-thin)_solid_var(--white-20p)]",
    "stalux-post-taxonomy-list-column": "flex-col",
    "stalux-post-taxonomy-item-column":
        "inline-flex no-underline [padding:var(--space-sm)_var(--space-xs)] [background:var(--white-05p)] text-ink-80 [border-left:var(--border-thick)_solid_var(--accent-60p)] [transition:color_var(--transition-medium),_transform_var(--transition-medium)] [border-radius:0_var(--radius-sm)_var(--radius-sm)_0] [font-size:var(--font-size-small)] [transform:translateX(0)]",
    "stalux-post-taxonomy-list-wrap": "flex-wrap",
    "stalux-post-taxonomy-item-pill":
        "inline-block no-underline whitespace-nowrap [padding:0.4rem_0.8rem] [background:var(--white-10p)] [border:none] [border-radius:var(--radius-full)] [font-size:var(--font-size-smaller)] [transition:color_var(--transition-medium),_transform_var(--transition-medium)] [transform:translateY(0)] text-ink-85",
    "stalux-post-taxonomy-empty":
        "text-center text-ink-50 [font-size:var(--font-size-small)] [padding:var(--space-md)_0]",
    "stalux-sidebar-right": "[scroll-padding-bottom:8rem]",
    "stalux-sidebar-container":
        "stalux-stack stalux-glass [box-shadow:var(--surface-glass-shadow)] [border-radius:14px] p-md [transition:box-shadow_220ms_ease,_background-color_220ms_ease]",
    "stalux-pagination":
        "w-full [margin:var(--space-lg)_0] [border-top:var(--border-thin)_solid_var(--white-20p)] [border-bottom:var(--border-thin)_solid_var(--white-20p)] [padding-top:var(--space-lg)] [padding-bottom:var(--space-lg)]",
    "stalux-pagination-inner": "flex justify-between [gap:var(--space-md)]",
    "stalux-pagination-link":
        "stalux-flex-row no-underline min-w-0 relative box-border [gap:var(--space-sm)] p-md [background:var(--black-10p)] [border-radius:var(--radius-md)] text-ink-90 [transition:background-color_var(--transition-normal),_transform_var(--transition-normal),_box-shadow_var(--transition-normal),_color_var(--transition-normal)] [box-shadow:var(--shadow-sidebar)] [flex:1_1_0]",
    "stalux-pagination-content": "stalux-stack min-w-0 overflow-hidden",
    "stalux-pagination-arrow":
        "shrink-0 stalux-flex-center text-ink-70 [transition:color_var(--transition-normal)]",
    "stalux-pagination-label":
        "[font-size:var(--font-size-small)] [color:var(--accent-90p)] [margin-bottom:var(--space-xs)] [font-weight:500]",
    "stalux-pagination-title":
        "whitespace-nowrap overflow-hidden max-w-full [font-size:var(--font-size-base)] [text-overflow:ellipsis] text-ink-90",
    "stalux-post-page": "w-full min-h-screen stalux-stack",
    "stalux-post-layout":
        "grid w-full box-border [flex:1] [grid-template-columns:minmax(220px,_250px)_minmax(0,_1fr)_minmax(220px,_250px)] [gap:clamp(1.5rem,_3vw,_3.5rem)] [max-width:1680px] [margin:0_auto] [padding:1.5rem_1rem]",
    "stalux-article":
        "w-full min-h-screen stalux-stack box-border [flex:1] stalux-glass [box-shadow:var(--surface-glass-shadow)] [border-radius:18px] [padding:clamp(1.25rem,_3vw,_2.5rem)]",
    "stalux-post-article-header":
        "[margin-bottom:3rem] [padding-bottom:2rem] [border-bottom:1px_solid_var(--white-10p)] [animation:stalux-post-content-reveal_220ms_ease_360ms_both]",
    "stalux-post-title":
        "font-bold text-center [font-size:2.5rem] text-ink-full [margin:0_0_1.5rem] [line-height:1.2] [word-break:break-word] stalux-glow",
    "stalux-post-metadata":
        "flex flex-wrap justify-center [gap:1.5rem] [font-size:0.95rem] [color:#ffffffb3]",
    "stalux-post-meta-item":
        "inline-flex items-center [gap:0.5rem] [transition:color_var(--transition-fast)_ease]",
    "stalux-post-page-stats":
        "flex justify-center items-center [margin-top:1rem] [padding-top:0.8rem] [border-top:1px_solid_var(--white-10p)] [font-size:0.9rem] [color:#ffffffb3] [gap:1rem]",
    "stalux-post-reading-time": "inline-flex items-center [gap:0.3rem]",
    "stalux-post-meta-row": "flex justify-center [flex-basis:100%]",
    "stalux-post-body":
        "max-w-full box-border [flex:1] [width:min(900px,_100%)] [margin:0_auto] [padding:0_1rem_2rem] [animation:stalux-post-content-reveal_220ms_ease_360ms_both]",
    "stalux-post-source-link-row": "flex justify-center [margin-top:1.2rem]",
    "stalux-post-source-link":
        "inline-flex items-center no-underline [gap:0.4rem] [padding:0.5rem_1.1rem] [font-size:0.85rem] [font-weight:500] text-ink-full [background:var(--white-10p)] [border-top:1px_solid_var(--white-20p)] [border-right:1px_solid_var(--white-20p)] [border-left:1px_solid_var(--white-20p)] [border-bottom:0] [border-radius:var(--radius-full,_999px)] [transition:background_var(--transition-fast)_ease,_transform_var(--transition-fast)_ease]",
    "stalux-post-article-footer":
        "[margin-top:3rem] [padding-top:2rem] [border-top:1px_solid_var(--white-10p)] [animation:stalux-post-content-reveal_220ms_ease_360ms_both]",
    "stalux-post-footer-content": "stalux-stack [gap:var(--space-lg)]",
    "stalux-card-post-title": "m-0 [line-height:1.35] [overflow-wrap:anywhere]",
    "stalux-card-post-description":
        "min-w-0 text-ink-70 [line-height:1.6] [overflow-wrap:anywhere]",
    "stalux-post-card":
        "w-full min-w-0 box-border cursor-pointer stalux-stack h-full [background-color:var(--card-bg)] [border-radius:var(--radius-lg)] [box-shadow:var(--card-box-shadow)] p-lg [transition:transform_220ms_cubic-bezier(0.22,_0.72,_0.22,_1)] [gap:var(--space-lg)]",
    "stalux-card-post-cover":
        "w-full min-w-0 overflow-hidden shrink-0 [height:180px] [border-radius:var(--radius-md)] [margin-bottom:0.5rem]",
    "stalux-card-post-meta": "stalux-stack [gap:0.6rem]",
    "stalux-card-time": "inline-flex items-center flex-wrap [gap:0.45rem]",
    "stalux-card-post-tags": "flex flex-wrap items-center [gap:0.4rem]",
    "stalux-card-post-tag":
        "inline-block [padding:0.22rem_0.7rem] [border-radius:9999px] [background:var(--tag-bg)] [color:#fff] [font-size:0.85rem] [line-height:1]",
    "stalux-card-post-categories": "flex flex-wrap items-center [gap:0.4rem]",
    "stalux-card-post-category":
        "inline-block [padding:0.18rem_0.5rem] [border-radius:6px] [background:var(--category-bg)] [color:#fff] [font-size:0.84rem] [line-height:1]",
    "stalux-card-read-more": "[margin-top:0.6rem] [align-self:flex-start]",
    "stalux-license-box":
        "relative overflow-hidden [background-color:var(--black-10p)] p-lg [border-radius:var(--radius-md)] [border:var(--border-thin)_solid_var(--white-20p)] [max-width:80%] [margin:var(--space-lg)_auto]",
    "stalux-license-content": "relative [z-index:2]",
    "stalux-license-title":
        "[margin-top:0] [margin-bottom:var(--space-sm)] [font-size:var(--font-size-subtitle)] text-ink-90",
    "stalux-license-watermark":
        "absolute pointer-events-none [bottom:0.5rem] [right:0.5rem] [opacity:0.15] [z-index:1] [transition:opacity_var(--transition-normal)]",
    "stalux-license-icon": "stalux-flex-center [width:120px] [height:120px]",
    "stalux-byline-sidebar-container": "stalux-stack [gap:var(--space-lg)]",
    "stalux-byline-author-section": "w-full",
    "stalux-byline-author-card":
        "stalux-stack [background:var(--black-05p)] [border-radius:var(--radius-lg)] p-md [box-shadow:var(--card-box-shadow)]",
    "stalux-byline-author-bio":
        "text-center w-full [font-size:var(--font-size-small)] text-ink-70 [margin:var(--space-md)_0_0] [line-height:1.6] [padding-top:var(--space-md)] [border-top:var(--border-thin)_solid_var(--white-10p)]",
    "stalux-cloud-cards": "block box-border [padding:1rem]",
    "stalux-cloud-tag-group":
        "flex flex-wrap justify-center items-start [gap:0.75rem] [margin-bottom:0.75rem] [content-visibility:auto] [contain-intrinsic-block-size:auto_24rem] [overflow-clip-margin:30px]",
    "stalux-cloud-canvas-frame": "[container-type:inline-size]",
    "stalux-cloud-tag-card":
        "relative stalux-flex-row no-underline overflow-hidden [padding:0.5rem_1rem] [border-radius:2rem] bg-ink-05 text-ink-full [border:1px_solid_var(--white-20p)] [transition:transform_var(--transition-slow),_border-color_var(--transition-slow)]",
    "stalux-cloud-tag-name": "[margin-right:0.5rem] [z-index:2]",
    "stalux-cloud-tag-count":
        "text-center bg-ink-20 [border-radius:1rem] [padding:0.1rem_0.4rem] [font-size:0.8rem] [min-width:1.5rem] [z-index:2]",
    "stalux-cloud-no-tags": "text-center w-full [font-size:1.2rem] text-ink-60 [padding:2rem]",
    "stalux-word-list-list":
        "stalux-stack items-center p-0 list-none [gap:1.5rem] [margin:2rem_auto]",
    "stalux-word-list-item": "w-full flex [max-width:900px]",
    "stalux-word-card":
        "w-full box-border stalux-stack stalux-glass [border-radius:var(--radius-lg,_12px)] [padding:1.5rem] [box-shadow:var(--card-box-shadow)] [transition:transform_var(--transition-normal)_ease,_box-shadow_var(--transition-normal)_ease] [gap:0.75rem]",
    "stalux-word-body": "text-ink-80 [line-height:1.7] [font-size:1.05rem]",
    "stalux-word-footer":
        "flex justify-between items-center [margin-top:auto] [padding-top:0.75rem] [border-top:1px_solid_var(--white-10p)] [gap:1rem] [font-size:0.9rem] text-ink-60",
    "stalux-word-date": "[font-variant-numeric:tabular-nums] text-ink-50",
    "stalux-word-source-meta": "stalux-flex-row flex-wrap [gap:0.5rem] [justify-content:flex-end]",
    "stalux-word-source-date": "italic text-ink-50",
    "stalux-word-source-text": "italic",
    "stalux-word-source-link":
        "underline italic [color:var(--accent-80p)] [text-decoration-color:var(--accent-50p)] [text-underline-offset:0.15em] [transition:color_var(--transition-fast)_ease]",
};
