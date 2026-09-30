import { createClientLogger } from "./logger";

import { registerPageLifecycle } from "./page-runtime";
import { ensureSearchStyles, upgradeAndOpenSearchDialog } from "./search-dialog";

const logger = createClientLogger("navigation");

interface SearchDialog extends HTMLElement {
    open?: () => void;
    close?: () => void;
}

async function openSearchDialog(): Promise<void> {
    logger.debug("loading search UI");
    await Promise.all([
        import("@pagefind/component-ui"),
        ensureSearchStyles(
            document.querySelector<HTMLLinkElement>("link[data-stalux-search-style]"),
        ),
    ]);
    const dialog = document.querySelector<SearchDialog>("pagefind-modal#search");
    await upgradeAndOpenSearchDialog(
        {
            whenDefined: (name) => customElements.whenDefined(name),
            upgrade: (element) => customElements.upgrade(element),
        },
        dialog,
    );
}

registerPageLifecycle("navigation", () => {
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

    const closeNav = () => {
        navList.removeAttribute("data-state");
        navOverlay?.removeAttribute("data-state");
        document.body.style.overflow = "";
    };
    const openNav = () => {
        navList.dataset.state = "open";
        navOverlay?.setAttribute("data-state", "show");
        document.body.style.overflow = "hidden";
    };
    const updateButtons = () => {
        frameId = 0;
        // Read layout before writing styles or attributes. Scrolling does not
        // change item sizes, so only resize events need to recalculate scale.
        const { clientWidth, scrollWidth, scrollLeft } = navList;
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
        needsScale = true;
        scheduleUpdate();
    };

    document.querySelector("[data-ref='stalux-search-btn']")?.addEventListener(
        "click",
        async (event) => {
            event.preventDefault();
            closeNav();
            try {
                await openSearchDialog();
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
    if (navList.parentElement) resizeObserver.observe(navList.parentElement);
    scheduleUpdate();

    return () => {
        document.querySelector<SearchDialog>("pagefind-modal#search")?.close?.();
        controller.abort();
        resizeObserver.disconnect();
        if (frameId) cancelAnimationFrame(frameId);
        closeNav();
    };
});
