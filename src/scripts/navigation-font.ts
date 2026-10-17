// Retain decoded faces across back/forward visits, without installing them in the old document.
// Bound this session cache: a blog reader can visit hundreds of distinct page subsets.
const fonts = new Map<string, { face: FontFace; ready: Promise<FontFace> }>();
const MAX_FONTS = 16;

function warmFont(href: string): Promise<FontFace> {
    const cached = fonts.get(href);
    if (cached) {
        fonts.delete(href);
        fonts.set(href, cached);
        return cached.ready;
    }
    const face = new FontFace("LXGW WenKai-Page Subset", `url(${JSON.stringify(href)})`, {
        style: "normal",
        weight: "100 900",
    });
    const ready = face.load();
    fonts.set(href, { face, ready });
    if (fonts.size > MAX_FONTS) fonts.delete(fonts.keys().next().value as string);
    void ready.catch(() => {
        if (fonts.get(href)?.ready === ready) fonts.delete(href);
    });
    return ready;
}

/** Give a cached font a short head start; a slow font must not hold the destination page hostage. */
export async function prepareNavigationFont(
    nextDocument: Document,
    signal: AbortSignal,
    timeoutMs = 150,
): Promise<void> {
    const href = nextDocument
        .querySelector<HTMLLinkElement>("link[data-stalux-page-font-preload]")
        ?.getAttribute("href");
    if (!href || signal.aborted || typeof FontFace === "undefined") return;
    let ready: Promise<FontFace>;
    try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        ready = warmFont(url.href);
    } catch {
        return;
    }
    await new Promise<void>((resolve) => {
        const finish = () => {
            clearTimeout(timer);
            signal.removeEventListener("abort", finish);
            resolve();
        };
        const timer = setTimeout(finish, timeoutMs);
        signal.addEventListener("abort", finish, { once: true });
        void ready.then(finish, finish);
    });
}
