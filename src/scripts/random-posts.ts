import { registerPageLifecycle } from "./page-runtime";

const sleep = (ms: number, signal: AbortSignal) =>
    new Promise<void>((resolve) => {
        const timer = window.setTimeout(resolve, ms);
        signal.addEventListener(
            "abort",
            () => {
                window.clearTimeout(timer);
                resolve();
            },
            { once: true },
        );
    });

function shuffle<T extends object>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const bytes = new Uint32Array(1);
        const j = (crypto.getRandomValues(bytes)[0] ?? 0) % (i + 1);
        const current = result[i];
        const target = result[j];
        if (!current || !target) throw new RangeError("Shuffle index is out of bounds");
        result[i] = target;
        result[j] = current;
    }
    return result;
}

async function fetchPosts(signal: AbortSignal) {
    const response = await fetch("/api/post.abbrlink.json", { signal });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return (await response.json()) as { abbrlink: string; title: string }[];
}

function render(posts: { abbrlink: string; title: string }[]) {
    return posts
        .map(
            (post) =>
                `<li class="random-post-item"><a href="/posts/${post.abbrlink}/" class="random-post-link a-none">${post.title}</a></li>`,
        )
        .join("");
}

async function refresh(container: HTMLElement, fallback: string, signal: AbortSignal) {
    const list = container.querySelector<HTMLElement>("#random-posts-list");
    if (!list) return;
    list.style.opacity = "0.5";
    await sleep(300, signal);
    if (signal.aborted) return;
    try {
        const posts = shuffle(await fetchPosts(signal)).slice(
            0,
            Number(container.dataset.count ?? 5),
        );
        if (signal.aborted) return;
        list.innerHTML = posts.length
            ? render(posts)
            : `<li class="no-posts">${container.dataset.noPosts ?? fallback}</li>`;
    } catch {
        if (signal.aborted) return;
        list.innerHTML = `<li class="error">${container.dataset.loadFailed ?? fallback}</li>`;
    } finally {
        if (!signal.aborted) list.style.opacity = "1";
    }
}

registerPageLifecycle("random-posts", () => {
    const container = document.querySelector<HTMLElement>("[data-stalux-random-posts]");
    if (!container) return;
    const controller = new AbortController();
    const fallback = container.dataset.loadError ?? "Failed to load posts";
    container.querySelector("#refresh-random-posts")?.addEventListener(
        "click",
        (event) => {
            event.preventDefault();
            void refresh(container, fallback, controller.signal);
        },
        { signal: controller.signal },
    );
    void refresh(container, fallback, controller.signal);
    return () => controller.abort();
});
