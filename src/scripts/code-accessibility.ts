/** Preserve EC's keyboard scroll access when an offscreen code subtree becomes rendered. */
export function mountCodeAccessibility(target: Document = document): (() => void) | undefined {
    const selector = "code[data-stalux-offscreen-code]";
    const codes = [...target.querySelectorAll<HTMLElement>(selector)];
    if (!codes.length) return;
    const update = (code: HTMLElement) => {
        if (!code.isConnected) return;
        const rendered =
            typeof code.checkVisibility === "function"
                ? code.checkVisibility({ contentVisibilityAuto: true })
                : true;
        if (!rendered) return;
        const pre = code.parentElement;
        if (
            pre?.tagName === "PRE" &&
            pre.scrollWidth > pre.clientWidth &&
            !pre.hasAttribute("tabindex")
        ) {
            pre.setAttribute("tabindex", "0");
            if (!pre.hasAttribute("role")) pre.setAttribute("role", "region");
        }
    };
    const reveal = (event: Event) => {
        if ((event as Event & { skipped?: boolean }).skipped) return;
        if (event.target instanceof HTMLElement && event.target.matches(selector))
            update(event.target);
    };
    for (const code of codes) update(code);
    target.addEventListener("contentvisibilityautostatechange", reveal, true);
    return () => target.removeEventListener("contentvisibilityautostatechange", reveal, true);
}
