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
    if (!navList || !buttonLeft || !buttonRight) return;

    const controller = new AbortController();
    const listenerOptions = { signal: controller.signal };
    let frameId = 0;
    let lastScale = "1";
    let needsScale = true;
    const mobileNav = window.matchMedia("(max-width: 600px)");

    const updateNavSurface = () => {
        siteNav?.toggleAttribute("data-scrolled", window.scrollY > 24);
        navToggle?.toggleAttribute("data-scrolled", window.scrollY > 24);
    };
    window.addEventListener("scroll", updateNavSurface, {
        passive: true,
        signal: controller.signal,
    });
    updateNavSurface();

    const closeNav = () => {
        navList.removeAttribute("data-state");
        navToggle?.removeAttribute("data-state");
        navToggle?.setAttribute("aria-expanded", "false");
        navOverlay?.removeAttribute("data-state");
        document.body.style.overflow = "";
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
        // Read layout before writing styles or attributes. Scrolling does not
        // change item sizes, so only resize events need to recalculate scale.
        const { clientWidth, scrollWidth, scrollLeft } = navList;
        const headerHeight = siteHeader?.offsetHeight ?? 0;
        const headerHeightValue = `${headerHeight}px`;
        if (
            siteHeader &&
            document.documentElement.style.getPropertyValue("--stalux-site-header-height") !==
                headerHeightValue
        ) {
            document.documentElement.style.setProperty(
                "--stalux-site-header-height",
                headerHeightValue,
            );
        }
        const navOffset = headerHeight + 16;
        document.documentElement.style.setProperty("--stalux-nav-offset", `${navOffset}px`);
        let nextScale = lastScale;
        if (needsScale) {
            needsScale = false;
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
        if (nextScale !== lastScale) {
            navList.style.setProperty("--nav-scale", nextScale);
            lastScale = nextScale;
        }
        const hasOverflow = scrollWidth > clientWidth;
        buttonLeft.toggleAttribute("data-visible", hasOverflow && scrollLeft > 1);
        buttonRight.toggleAttribute(
            "data-visible",
            hasOverflow && scrollLeft + clientWidth < scrollWidth - 1,
        );
    };
    const scheduleUpdate = () => {
        if (!frameId) frameId = requestAnimationFrame(updateButtons);
    };
    const scheduleResize = () => {
        if (!mobileNav.matches) closeNav();
        updateNavSurface();
        needsScale = true;
        scheduleUpdate();
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
        document.documentElement.style.removeProperty("--stalux-nav-offset");
        document.documentElement.style.removeProperty("--stalux-site-header-height");
    };
});
