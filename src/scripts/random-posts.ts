const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const bytes = new Uint32Array(1);
        const j = globalThis.crypto?.getRandomValues
            ? (crypto.getRandomValues(bytes)[0] ?? 0) % (i + 1)
            : Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

async function fetchPosts() {
    const response = await fetch("/api/post.abbrlink.json");
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

async function refresh(container: HTMLElement, fallback: string) {
    const list = container.querySelector<HTMLElement>("#random-posts-list");
    if (!list) return;
    list.style.opacity = "0.5";
    await sleep(300);
    try {
        const posts = shuffle(await fetchPosts()).slice(0, Number(container.dataset.count ?? 5));
        list.innerHTML = posts.length
            ? render(posts)
            : `<li class="no-posts">${container.dataset.noPosts ?? fallback}</li>`;
    } catch {
        list.innerHTML = `<li class="error">${container.dataset.loadFailed ?? fallback}</li>`;
    } finally {
        list.style.opacity = "1";
    }
}

document.addEventListener("astro:page-load", () => {
    const container = document.querySelector<HTMLElement>("[data-stalux-random-posts]");
    if (!container || container.dataset.staluxBound === "true") return;
    container.dataset.staluxBound = "true";
    container.querySelector("#refresh-random-posts")?.addEventListener("click", async (event) => {
        event.preventDefault();
        await refresh(container, container.dataset.loadError ?? "Failed to load posts");
    });
    void refresh(container, container.dataset.loadError ?? "Failed to load posts");
});

export {};
