import { registerPageLifecycle } from "./page-runtime";

function scrollToWord(hash: string): void {
    const element = document.getElementById(hash.slice(1));
    if (!element) return;
    for (const highlighted of document.querySelectorAll("[data-glow]")) {
        highlighted.removeAttribute("data-glow");
    }
    element.dataset.glow = "";
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    history.replaceState(null, "", hash);
}

registerPageLifecycle("word-list", () => {
    if (!document.querySelector("[data-word-hash]")) return;
    const controller = new AbortController();
    let firstFrame = 0;
    let secondFrame = 0;

    if (location.hash.startsWith("#word-")) {
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
