import { createClientLogger } from "./logger";

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

const siteNav = document.querySelector<HTMLElement>("[data-ref='stalux-site-nav']");
const siteHeader = document.querySelector<HTMLElement>(".stalux-site-header");
const navList = document.querySelector<HTMLElement>("[data-ref='stalux-nav-list']");
const navToggle = document.querySelector<HTMLButtonElement>("[data-ref='stalux-nav-toggle']");
const drawer = document.querySelector<HTMLDialogElement>("#stalux-mobile-navigation");
const panel = drawer?.querySelector("[data-ref='stalux-mobile-nav-panel']");
const buttonLeft = document.querySelector<HTMLButtonElement>("[data-ref='stalux-nav-scroll-left']");
const buttonRight = document.querySelector<HTMLButtonElement>(
    "[data-ref='stalux-nav-scroll-right']",
);
const mobileNav = window.matchMedia("(max-width: 600px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let search = new AbortController();

if (siteNav && siteHeader && navList && navToggle && drawer && panel && buttonLeft && buttonRight) {
    const desktopContainer = navList.parentElement;
    const sentinel = document.querySelector("[data-stalux-nav-sentinel]");
    if (sentinel) {
        new IntersectionObserver(([entry]) => {
            if (!entry) return;
            siteNav.toggleAttribute("data-scrolled", !entry.isIntersecting);
            navToggle.toggleAttribute("data-scrolled", !entry.isIntersecting);
        }).observe(sentinel);
    }

    navToggle.addEventListener("click", () => {
        panel.append(navList);
        drawer.showModal();
        navToggle.setAttribute("aria-expanded", "true");
    });
    drawer.addEventListener("close", () => {
        if (drawer.open) return;
        desktopContainer?.insertBefore(navList, buttonRight);
        navToggle.setAttribute("aria-expanded", "false");
    });
    // The dialog fills the viewport; the panel is its only interactive child.
    // A pointer drag beginning inside the panel must not dismiss the dialog.
    let pressedOutside = false;
    drawer.addEventListener("pointerdown", (event) => {
        pressedOutside = event.target === drawer;
    });
    drawer.addEventListener("click", (event) => {
        if (pressedOutside && event.target === drawer) drawer.close();
        pressedOutside = false;
        if (event.target instanceof Element) {
            const link = event.target.closest<HTMLAnchorElement>("a[data-ref='stalux-nav-link']");
            if (link?.pathname === location.pathname) drawer.close();
        }
    });
    mobileNav.addEventListener("change", () => {
        if (!mobileNav.matches) drawer.close();
    });

    const updateButtons = () => {
        if (mobileNav.matches || drawer.open) return;
        const { scrollLeft, scrollWidth, clientWidth } = navList;
        const left = scrollLeft > 1;
        const right = scrollLeft + clientWidth < scrollWidth - 1;
        buttonLeft.toggleAttribute("data-visible", left);
        buttonRight.toggleAttribute("data-visible", right);
        buttonLeft.setAttribute("aria-disabled", String(!left));
        buttonRight.setAttribute("aria-disabled", String(!right));
    };
    let frame = 0;
    const scheduleButtons = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            updateButtons();
        });
    };
    navList.addEventListener("scroll", scheduleButtons, { passive: true });
    for (const [button, direction] of [
        [buttonLeft, -1],
        [buttonRight, 1],
    ] as const) {
        button.addEventListener("click", () => {
            if (button.getAttribute("aria-disabled") === "true") return;
            navList.scrollBy({
                left: direction * 300,
                behavior: reducedMotion.matches ? "instant" : "smooth",
            });
        });
    }
    const resize = new ResizeObserver((entries) => {
        const header = entries.find(({ target }) => target === siteHeader);
        const height = header?.borderBoxSize[0]?.blockSize;
        if (height !== undefined) {
            const style = document.documentElement.style;
            style.setProperty("--stalux-site-header-height", `${Math.round(height)}px`);
            style.setProperty("--stalux-nav-offset", `${Math.round(height) + 16}px`);
        }
        scheduleButtons();
    });
    resize.observe(siteHeader, { box: "border-box" });
    resize.observe(navList);
    for (const item of navList.children) resize.observe(item, { box: "border-box" });
}

document.querySelector("[data-ref='stalux-search-btn']")?.addEventListener("click", async () => {
    drawer?.close();
    try {
        await openSearchDialog(search.signal);
        logger.debug("search dialog opened");
    } catch (error) {
        logger.error("search dialog failed to open; next click can retry", error);
        throw error;
    }
});

document.addEventListener("astro:after-swap", () => {
    drawer?.close();
    search.abort();
    search = new AbortController();
    document.querySelector<SearchDialog>("pagefind-modal#search")?.close?.();
});
