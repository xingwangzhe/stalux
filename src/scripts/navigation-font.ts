/** Warm the destination font while the old page is still visible. Never delay navigation indefinitely. */
export async function prepareNavigationFont(
    nextDocument: Document,
    signal: AbortSignal,
    timeoutMs = 1000,
): Promise<void> {
    const href = nextDocument
        .querySelector<HTMLLinkElement>("link[data-stalux-page-font-preload]")
        ?.getAttribute("href");
    if (!href || signal.aborted || typeof FontFace === "undefined") return;
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;
    // Loading a detached face fills the font cache without replacing the old page's font.
    const face = new FontFace("LXGW WenKai-Page Subset", `url(${JSON.stringify(url.href)})`, {
        style: "normal",
        weight: "100 900",
    });
    await new Promise<void>((resolve) => {
        const finish = () => {
            clearTimeout(timer);
            signal.removeEventListener("abort", finish);
            resolve();
        };
        const timer = setTimeout(finish, timeoutMs);
        signal.addEventListener("abort", finish, { once: true });
        void face.load().then(finish, finish);
    });
}
