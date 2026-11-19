/** Preserve EC's keyboard scroll access when an offscreen code subtree becomes rendered. */
export function mountCodeAccessibility(target: Document = document): (() => void) | undefined {
    const selector = "code[data-stalux-offscreen-code]";
    const codes = [...target.querySelectorAll<HTMLElement>(selector)];
    if (!codes.length) return;
    const overflowingPre = (code: Element): HTMLElement | undefined => {
        if (!code.isConnected) return;
        const rendered =
            typeof code.checkVisibility === "function"
                ? code.checkVisibility({ contentVisibilityAuto: true })
                : true;
        if (!rendered) return;
        const pre = code.parentElement;
        if (
            pre?.tagName === "PRE" &&
            !pre.hasAttribute("tabindex") &&
            pre.scrollWidth > pre.clientWidth
        ) {
            return pre;
        }
        return undefined;
    };
    const enableKeyboardScroll = (pre: HTMLElement | undefined) => {
        if (!pre) return;
        pre.setAttribute("tabindex", "0");
        if (!pre.hasAttribute("role")) pre.setAttribute("role", "region");
    };
    const reveal = (event: Event) => {
        if ((event as Event & { skipped?: boolean }).skipped) return;
        if (event.target instanceof HTMLElement && event.target.matches(selector))
            enableKeyboardScroll(overflowingPre(event.target));
    };
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === "function") {
        observer = new IntersectionObserver((entries, currentObserver) => {
            const visible = entries.filter((entry) => entry.isIntersecting);
            const overflowing = visible.map(({ target }) => overflowingPre(target));
            for (const pre of overflowing) enableKeyboardScroll(pre);
            for (const { target } of visible) currentObserver.unobserve(target);
        });
        for (const code of codes) observer.observe(code);
    } else {
        for (const pre of codes.map(overflowingPre)) enableKeyboardScroll(pre);
    }
    target.addEventListener("contentvisibilityautostatechange", reveal, true);
    return () => {
        observer?.disconnect();
        target.removeEventListener("contentvisibilityautostatechange", reveal, true);
    };
}
