import { registerPageLifecycle } from "./page-runtime";

function scrollToWord(hash: string): void {
    const element = document.getElementById(hash.slice(1));
    if (!element) return;
    for (const highlighted of document.querySelectorAll("[data-glow]")) {
        highlighted.removeAttribute("data-glow");
    }
    element.dataset.glow = "";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "center" });
    // Keep Swup's source/index so back from another page can restore this entry.
    history.replaceState(
        { ...history.state, url: `${location.pathname}${location.search}${hash}` },
        "",
        hash,
    );
}

registerPageLifecycle("word-list", () => {
    if (!document.querySelector("[data-word-hash]")) return;
    const controller = new AbortController();
    let firstFrame = 0;
    let secondFrame = 0;

    if (location.hash.startsWith("#word-") && !window.swup?.visit.history.popstate) {
        firstFrame = requestAnimationFrame(() => {
            firstFrame = 0;
            secondFrame = requestAnimationFrame(() => {
                secondFrame = 0;
                scrollToWord(location.hash);
            });
        });
    }

    document.addEventListener(
        "click",
        (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const link = target.closest<HTMLAnchorElement>("a[data-word-hash]");
            const hash = link?.dataset.wordHash;
            if (!hash) return;
            event.preventDefault();
            scrollToWord(hash);
        },
        { signal: controller.signal },
    );

    return () => {
        controller.abort();
        if (firstFrame) cancelAnimationFrame(firstFrame);
        if (secondFrame) cancelAnimationFrame(secondFrame);
    };
});
