interface AnchorRect {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

/** Prefer the title's right side, falling below it when that side has no room. */
export function getArchiveDescriptionPosition(
    anchor: AnchorRect,
    width: number,
    height: number,
    viewportWidth: number,
    viewportHeight: number,
): { left: number; top: number; maxHeight?: number } {
    const fitsRight = anchor.right + 12 + width <= viewportWidth - 16;
    const left = fitsRight ? anchor.right + 12 : anchor.left;
    let top = fitsRight ? anchor.top : anchor.bottom + 8;
    let maxHeight: number | undefined;
    if (!fitsRight && top + height > viewportHeight - 16) {
        const above = Math.max(0, anchor.top - 24);
        const below = Math.max(0, viewportHeight - anchor.bottom - 24);
        const useBelow = below >= above;
        const available = useBelow ? below : above;
        const visibleHeight = Math.min(height, available);
        top = useBelow ? anchor.bottom + 8 : anchor.top - visibleHeight - 8;
        if (visibleHeight < height) maxHeight = visibleHeight;
    }
    return {
        left: Math.max(16, Math.min(left, viewportWidth - width - 16)),
        top: Math.max(16, fitsRight ? Math.min(top, viewportHeight - height - 16) : top),
        ...(maxHeight === undefined ? {} : { maxHeight }),
    };
}

export function mountArchiveDescriptions() {
    const root = document.querySelector<HTMLElement>(".stalux-archive-container");
    const tooltip = document.querySelector<HTMLElement>("[data-archive-tooltip]");
    if (!(root && tooltip)) return;
    const usePopover =
        typeof tooltip.showPopover === "function" && typeof tooltip.hidePopover === "function";
    if (usePopover) tooltip.setAttribute("popover", "manual");
    let popoverOpen = false;
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    let active: HTMLAnchorElement | undefined;
    let previousDescription: string | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const clearClose = () => {
        clearTimeout(closeTimer);
        closeTimer = undefined;
    };
    const hide = () => {
        clearClose();
        if (active) {
            if (previousDescription === null) active.removeAttribute("aria-describedby");
            else active.setAttribute("aria-describedby", previousDescription);
        }
        active = undefined;
        if (popoverOpen) {
            tooltip.hidePopover();
            popoverOpen = false;
        }
        tooltip.hidden = true;
        tooltip.textContent = "";
    };
    const show = (link: HTMLAnchorElement) => {
        const description = link.dataset.archiveDescription?.trim();
        if (!description) return;
        clearClose();
        if (active !== link) {
            hide();
            active = link;
            previousDescription = link.getAttribute("aria-describedby");
            link.setAttribute(
                "aria-describedby",
                [previousDescription, tooltip.id].filter(Boolean).join(" "),
            );
            tooltip.textContent = description;
        }
        tooltip.hidden = false;
        if (usePopover && !popoverOpen) {
            tooltip.showPopover();
            popoverOpen = true;
        }
        tooltip.style.maxHeight = "";
        const { left, top, maxHeight } = getArchiveDescriptionPosition(
            link.getBoundingClientRect(),
            tooltip.offsetWidth,
            tooltip.offsetHeight,
            document.documentElement.clientWidth,
            document.documentElement.clientHeight,
        );
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        if (maxHeight !== undefined) tooltip.style.maxHeight = `${maxHeight}px`;
    };
    const linkFrom = (target: EventTarget | null) =>
        target instanceof Element
            ? target.closest<HTMLAnchorElement>(".stalux-archive-post-link")
            : null;
    const enter = (event: Event) => {
        if (event.type === "pointerover" && !hover.matches) return;
        const link = linkFrom(event.target);
        // Touch/mouse focus must not put a top-layer popover under the pending click.
        // Keyboard focus still exposes the same accessible preview.
        if (event.type === "focusin" && !link?.matches(":focus-visible")) return;
        if (link && root.contains(link)) show(link);
    };
    const leave = (event: Event) => {
        const link = linkFrom(event.target);
        if (link !== active) return;
        const related = (event as FocusEvent).relatedTarget;
        if (related instanceof Node && (active?.contains(related) || tooltip.contains(related)))
            return;
        clearClose();
        closeTimer = setTimeout(hide, 120);
    };
    const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") hide();
    };
    const navigate = (event: Event) => {
        if (linkFrom(event.target)) hide();
    };
    const scroll = (event: Event) => {
        if (event.target instanceof Node && tooltip.contains(event.target)) return;
        hide();
    };
    const visibility = () => {
        if (document.hidden) hide();
    };
    root.addEventListener("pointerover", enter);
    root.addEventListener("pointerout", leave);
    root.addEventListener("focusin", enter);
    root.addEventListener("focusout", leave);
    root.addEventListener("click", navigate, true);
    tooltip.addEventListener("pointerenter", clearClose);
    tooltip.addEventListener("pointerleave", hide);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("scroll", scroll, { capture: true, passive: true });
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", hide);
    window.addEventListener("beforeprint", hide);
    hover.addEventListener("change", hide);
    return () => {
        hide();
        root.removeEventListener("pointerover", enter);
        root.removeEventListener("pointerout", leave);
        root.removeEventListener("focusin", enter);
        root.removeEventListener("focusout", leave);
        root.removeEventListener("click", navigate, true);
        tooltip.removeEventListener("pointerenter", clearClose);
        tooltip.removeEventListener("pointerleave", hide);
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("scroll", scroll, true);
        document.removeEventListener("visibilitychange", visibility);
        window.removeEventListener("resize", hide);
        window.removeEventListener("beforeprint", hide);
        hover.removeEventListener("change", hide);
    };
}
