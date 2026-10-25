import { createClientLogger } from "./logger";
import { registerPageLifecycle } from "./page-runtime";

const logger = createClientLogger("random-posts");

function shuffle<T extends object>(items: T[]): T[] {
    const result = [...items];
    const bytes = new Uint32Array(1);
    for (let i = result.length - 1; i > 0; i -= 1) {
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

export function mountRandomPosts(): (() => void) | undefined {
    const container = document.querySelector<HTMLElement>("[data-stalux-random-posts]");
    const list = container?.querySelector<HTMLElement>("#random-posts-list");
    if (!container || !list) return;
    const controller = new AbortController();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fallback = container.dataset.loadError ?? "Failed to load posts";
    let request: AbortController | undefined;
    let animation: Animation | undefined;
    let revision = 0;
    let disposed = false;
    const cancelAnimation = () => {
        const previous = animation;
        animation = undefined;
        previous?.cancel();
    };
    const reveal = () => {
        if (reducedMotion.matches || document.hidden || typeof list.animate !== "function") return;
        // A persisted sidebar keeps its node across visits; fading it again would
        // read as the fixed shell blinking, which is exactly what it must not do.
        if (container.closest("[data-swup-persist]")) return;
        try {
            // Real titles can wrap the sidebar beyond the same bounded-region
            // budget used for route effects. Keep that result immediately readable.
            if (list.getBoundingClientRect().height > Math.min(420, window.innerHeight * 0.6))
                return;
            const current = list.animate(
                { opacity: [0.82, 1] },
                { duration: 100, easing: "ease-out" },
            );
            animation = current;
            const release = () => {
                // A completed old effect cannot release a newer refresh cue.
                if (animation === current) animation = undefined;
                current.cancel();
            };
            void current.finished.then(release, release);
        } catch {
            // The authored list stays fully readable when animation is unavailable.
        }
    };
    const refresh = async () => {
        // Latest click wins, including fetch implementations whose pending JSON
        // decoding cannot be interrupted by AbortSignal.
        request?.abort();
        const current = new AbortController();
        request = current;
        const token = ++revision;
        const isCurrent = () => !disposed && token === revision && !current.signal.aborted;
        cancelAnimation();
        container.setAttribute("aria-busy", "true");
        try {
            logger.debug("refresh started");
            const posts = shuffle(await fetchPosts(current.signal)).slice(
                0,
                Number(container.dataset.count ?? 5),
            );
            if (!isCurrent()) return;
            logger.debug(`refresh completed; posts=${posts.length}`);
            list.innerHTML = posts.length
                ? render(posts)
                : `<li class="no-posts">${container.dataset.noPosts ?? fallback}</li>`;
            reveal();
        } catch (error) {
            if (!isCurrent()) return;
            logger.error("refresh failed; showing fallback", error);
            list.innerHTML = `<li class="error">${container.dataset.loadFailed ?? fallback}</li>`;
        } finally {
            if (isCurrent()) {
                request = undefined;
                container.removeAttribute("aria-busy");
            }
        }
    };
    container.querySelector("#refresh-random-posts")?.addEventListener(
        "click",
        (event) => {
            event.preventDefault();
            void refresh();
        },
        { signal: controller.signal },
    );
    reducedMotion.addEventListener("change", cancelAnimation, { signal: controller.signal });
    void refresh();
    return () => {
        disposed = true;
        revision++;
        request?.abort();
        controller.abort();
        cancelAnimation();
        container.removeAttribute("aria-busy");
    };
}

registerPageLifecycle("random-posts", mountRandomPosts);
