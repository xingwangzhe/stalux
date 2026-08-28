import { registerPageLifecycle } from "./page-runtime";
import { upgradeAndOpenSearchDialog } from "./search-dialog";

interface SearchDialog extends HTMLElement {
    open?: () => void;
    close?: () => void;
}

async function openSearchDialog(): Promise<void> {
    await import("@pagefind/component-ui");
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
    const updateScrollButtons = () => {
        const hasOverflow = navList.scrollWidth > navList.clientWidth;
        const atStart = navList.scrollLeft <= 1;
        const atEnd = navList.scrollLeft + navList.clientWidth >= navList.scrollWidth - 1;
        buttonLeft.toggleAttribute("data-visible", hasOverflow && !atStart);
        buttonRight.toggleAttribute("data-visible", hasOverflow && !atEnd);
    };
    const updateButtons = () => {
        frameId = 0;
        const baseFontSize = Number.parseFloat(getComputedStyle(navList).fontSize) || 16;
        const gap = Number.parseFloat(getComputedStyle(navList).gap) || 0;
        const estimatedWidth =
            [...navList.children].reduce(
                (total, item) => total + item.getBoundingClientRect().width,
                0,
            ) +
            gap * Math.max(0, navList.children.length - 1);
        const scale =
            estimatedWidth > navList.clientWidth
                ? Math.max(12 / baseFontSize, navList.clientWidth / estimatedWidth)
                : 1;
        const nextScale = String(scale);
        if (nextScale !== lastScale) {
            navList.style.setProperty("--nav-scale", nextScale);
            lastScale = nextScale;
        }
        updateScrollButtons();
    };
    const scheduleUpdate = () => {
        if (!frameId) frameId = requestAnimationFrame(updateButtons);
    };

    document.querySelector("[data-ref='stalux-search-btn']")?.addEventListener(
        "click",
        async (event) => {
            event.preventDefault();
            closeNav();
            await openSearchDialog();
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
    window.addEventListener("resize", scheduleUpdate, {
        passive: true,
        signal: controller.signal,
    });

    const resizeObserver = new ResizeObserver(scheduleUpdate);
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
