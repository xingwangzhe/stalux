import { createClientLogger } from "./logger";

import { registerPageLifecycle } from "./page-runtime";
import { ensureSearchStyles, upgradeAndOpenSearchDialog } from "./search-dialog";

const logger = createClientLogger("navigation");

interface SearchDialog extends HTMLElement {
    open?: () => void;
    close?: () => void;
}

async function openSearchDialog(signal: AbortSignal): Promise<void> {
    logger.debug("loading search UI");
    await Promise.all([
        import("@pagefind/component-ui"),
        ensureSearchStyles(
            document.querySelector<HTMLLinkElement>("link[data-stalux-search-style]"),
        ),
    ]);
    if (signal.aborted) return;
    const dialog = document.querySelector<SearchDialog>("pagefind-modal#search");
    await upgradeAndOpenSearchDialog(
        {
            whenDefined: (name) => customElements.whenDefined(name),
            upgrade: (element) => customElements.upgrade(element),
        },
        dialog,
        signal,
    );
}

registerPageLifecycle("navigation", () => {
    const siteNav = document.querySelector<HTMLElement>("[data-ref='stalux-site-nav']");
    const siteHeader = document.querySelector<HTMLElement>(".stalux-site-header");
    const navList = document.querySelector<HTMLElement>("[data-ref='stalux-nav-list']");
    const navToggle = document.querySelector<HTMLElement>("[data-ref='stalux-nav-toggle']");
    const navOverlay = document.querySelector<HTMLElement>("[data-ref='stalux-nav-overlay']");
    const buttonLeft = document.querySelector<HTMLElement>("[data-ref='stalux-nav-scroll-left']");
    const buttonRight = document.querySelector<HTMLElement>("[data-ref='stalux-nav-scroll-right']");
    if (!(navList && buttonLeft && buttonRight)) return;

    const controller = new AbortController();
    const listenerOptions = { signal: controller.signal };
    let frameId = 0;
    let lastScale = navList.style.getPropertyValue("--nav-scale") || "1";
    let needsButtons = true;
    let needsSurface = true;
    let needsResize = false;
    let needsScale = true;
    const mobileNav = window.matchMedia("(max-width: 600px)");

    const closeNav = () => {
        navList.removeAttribute("data-state");
        navToggle?.removeAttribute("data-state");
        navToggle?.setAttribute("aria-expanded", "false");
        navOverlay?.removeAttribute("data-state");
        if (document.body.style.overflow) document.body.style.overflow = "";
    };
    const openNav = () => {
        navList.dataset.state = "open";
        navToggle?.setAttribute("data-state", "open");
        navToggle?.setAttribute("aria-expanded", "true");
        navOverlay?.setAttribute("data-state", "show");
        document.body.style.overflow = "hidden";
    };
    const updateButtons = () => {
        frameId = 0;
        // Collect every layout read before changing attributes or inherited
        // root variables. Even scrollY can force style calculation after a swap.
        const scrolled = needsSurface ? window.scrollY > 24 : undefined;
        const shouldCloseNav = needsResize && !mobileNav.matches;
        const updateOverflow = needsButtons;
        const clientWidth = updateOverflow ? navList.clientWidth : 0;
        const scrollWidth = updateOverflow ? navList.scrollWidth : 0;
        const scrollLeft = updateOverflow ? navList.scrollLeft : 0;
        const headerHeight = updateOverflow ? (siteHeader?.offsetHeight ?? 0) : 0;
        let nextScale = lastScale;
        if (needsScale) {
            if (mobileNav.matches) {
                nextScale = "1";
            } else {
                const style = getComputedStyle(navList);
                const baseFontSize = Number.parseFloat(style.fontSize) || 16;
                const gap = Number.parseFloat(style.gap) || 0;
                let estimatedWidth = gap * Math.max(0, navList.children.length - 1);
                for (const item of navList.children) {
                    // offsetWidth excludes the existing transform, avoiding
                    // scale feedback during repeated resize notifications.
                    if (item instanceof HTMLElement) estimatedWidth += item.offsetWidth;
                }
                nextScale = String(
                    estimatedWidth > clientWidth
                        ? Math.max(12 / baseFontSize, clientWidth / estimatedWidth)
                        : 1,
                );
            }
        }
        needsButtons = false;
        needsSurface = false;
        needsResize = false;
        needsScale = false;

        if (updateOverflow) {
            const rootStyle = document.documentElement.style;
            const headerHeightValue = `${headerHeight}px`;
            if (
                siteHeader &&
                rootStyle.getPropertyValue("--stalux-site-header-height") !== headerHeightValue
            ) {
                rootStyle.setProperty("--stalux-site-header-height", headerHeightValue);
            }
            const navOffsetValue = `${headerHeight + 16}px`;
            if (rootStyle.getPropertyValue("--stalux-nav-offset") !== navOffsetValue) {
                rootStyle.setProperty("--stalux-nav-offset", navOffsetValue);
            }
        }
        if (nextScale !== lastScale) {
            navList.style.setProperty("--nav-scale", nextScale);
            lastScale = nextScale;
        }
        if (scrolled !== undefined) {
            siteNav?.toggleAttribute("data-scrolled", scrolled);
            navToggle?.toggleAttribute("data-scrolled", scrolled);
        }
        if (updateOverflow) {
            const hasOverflow = scrollWidth > clientWidth;
            buttonLeft.toggleAttribute("data-visible", hasOverflow && scrollLeft > 1);
            buttonRight.toggleAttribute(
                "data-visible",
                hasOverflow && scrollLeft + clientWidth < scrollWidth - 1,
            );
        }
        if (shouldCloseNav) closeNav();
    };
    const scheduleFrame = () => {
        if (!frameId) frameId = requestAnimationFrame(updateButtons);
    };
    const scheduleUpdate = () => {
        needsButtons = true;
        scheduleFrame();
    };
    const scheduleSurface = () => {
        needsSurface = true;
        scheduleFrame();
    };
    const scheduleResize = () => {
        needsButtons = true;
        needsSurface = true;
        needsResize = true;
        needsScale = true;
        scheduleFrame();
    };

    document.querySelector("[data-ref='stalux-search-btn']")?.addEventListener(
        "click",
        async (event) => {
            event.preventDefault();
            closeNav();
            try {
                await openSearchDialog(controller.signal);
                logger.debug("search dialog opened");
            } catch (error) {
                logger.error("search dialog failed to open; next click can retry", error);
                throw error;
            }
        },
        listenerOptions,
    );
    navToggle?.addEventListener("click", openNav, listenerOptions);
    navOverlay?.addEventListener("click", closeNav, listenerOptions);
    for (const link of document.querySelectorAll("[data-ref='stalux-nav-link']")) {
        link.addEventListener("click", closeNav, listenerOptions);
    }
    buttonLeft.addEventListener(
        "click",
        () => navList.scrollBy({ left: -300, behavior: "smooth" }),
        listenerOptions,
    );
    buttonRight.addEventListener(
        "click",
        () => navList.scrollBy({ left: 300, behavior: "smooth" }),
        listenerOptions,
    );
    navList.addEventListener("scroll", scheduleUpdate, {
        passive: true,
        signal: controller.signal,
    });
    window.addEventListener("scroll", scheduleSurface, {
        passive: true,
        signal: controller.signal,
    });
    window.addEventListener("resize", scheduleResize, {
        passive: true,
        signal: controller.signal,
    });

    document.fonts.addEventListener("loadingdone", scheduleResize, listenerOptions);

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(navList);
    if (siteHeader) resizeObserver.observe(siteHeader);
    if (navList.parentElement) resizeObserver.observe(navList.parentElement);
    scheduleUpdate();

    return () => {
        document.querySelector<SearchDialog>("pagefind-modal#search")?.close?.();
        controller.abort();
        resizeObserver.disconnect();
        if (frameId) cancelAnimationFrame(frameId);
        closeNav();
        // Keep --stalux-nav-offset and --stalux-site-header-height for the
        // persisted header, avoiding inherited-style invalidation per page.
    };
});
