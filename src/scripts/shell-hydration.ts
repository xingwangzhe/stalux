/**
 * Keep a shell's frame, refresh only the parts that describe the page.
 *
 * A `data-swup-persist` node is kept whole by Swup: that is what makes the
 * sidebars, the header and the footer survive a visit. For a container whose
 * *frame* is stable but whose *contents* belong to the page (the article's TOC,
 * tag list and category list), keeping the node whole would show the previous
 * article's headings. Marking it `data-stalux-shell-slot` says: keep this node,
 * take the children from the page we are navigating to.
 *
 * Doing it here, synchronously after the swap and before `astro:after-swap`, means
 * every page module that mounts later sees the refreshed lists and nothing has to
 * be measured or re-rendered a second time.
 */
const SLOT = "[data-stalux-shell-slot]";

/** Persist nodes that existed before this swap; only their slots need refilling. */
const retained = new WeakSet<Element>();

/** Call before the content is replaced, while the old document is still live. */
export function markRetainedShells(): void {
    for (const element of document.querySelectorAll("[data-swup-persist]")) retained.add(element);
}

export function hydrateShells(next: Document | undefined): number {
    if (!next || typeof next.querySelector !== "function") return 0;
    let hydrated = 0;
    for (const live of document.querySelectorAll<HTMLElement>(SLOT)) {
        const slot = live.getAttribute?.("data-stalux-shell-slot");
        if (!slot) continue;
        // A slot that arrived with the incoming document already holds the right
        // children; replacing them again would dirty layout for nothing.
        const shell = live.closest("[data-swup-persist]");
        if (!(shell && retained.has(shell))) continue;
        const incoming = next.querySelector<HTMLElement>(`[data-stalux-shell-slot="${slot}"]`);
        if (!incoming) continue;
        // Two articles often share the same tags or the same category. Writing
        // identical children back would dirty layout for a subtree that is
        // already correct.
        if (live.innerHTML === incoming.innerHTML) continue;
        // The incoming nodes belong to another document; importNode adopts them.
        const fresh = document.importNode(incoming, true);
        live.replaceChildren(...fresh.childNodes);
        // These lists are new content even though their frame is old, so the
        // unroll cue still applies to them.
        for (const group of live.querySelectorAll<HTMLElement>("[data-stalux-reveal]"))
            group.setAttribute("data-stalux-shell-fresh", "");
        hydrated++;
    }
    // A shell that is itself new (first visit to an article, or any move between
    // page types) brings fresh lists with it: they are content, not a kept frame.
    for (const group of document.querySelectorAll<HTMLElement>(
        "[data-swup-persist] [data-stalux-reveal]",
    )) {
        const shell = group.closest("[data-swup-persist]");
        if (shell && !retained.has(shell) && !group.hasAttribute("data-stalux-shell-fresh"))
            group.setAttribute("data-stalux-shell-fresh", "");
    }
    return hydrated;
}
