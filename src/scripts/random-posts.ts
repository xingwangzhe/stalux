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
        if (!(current && target)) throw new RangeError("Shuffle index is out of bounds");
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

// Modern Web Guidance (javascript/DOM): 用 DOM API 组装节点 + replaceChildren，
// 不再把接口返回的标题拼进 innerHTML —— 标题里的 <、& 会被当成标记解析。
function createMessageItem(className: string, text: string): HTMLLIElement {
    const item = document.createElement("li");
    item.className = className;
    item.textContent = text;
    return item;
}

function createPostItem(post: { abbrlink: string; title: string }): HTMLLIElement {
    const item = document.createElement("li");
    item.className = "random-post-item";
    const link = document.createElement("a");
    link.href = `/posts/${encodeURIComponent(post.abbrlink)}/`;
    link.className = "random-post-link a-none";
    link.textContent = post.title;
    item.append(link);
    return item;
}

export function mountRandomPosts(): (() => void) | undefined {
    const container = document.querySelector<HTMLElement>("[data-stalux-random-posts]");
    const list = container?.querySelector<HTMLElement>("#random-posts-list");
    if (!(container && list)) return;
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
            list.replaceChildren(
                ...(posts.length > 0
                    ? posts.map(createPostItem)
                    : [createMessageItem("no-posts", container.dataset.noPosts ?? fallback)]),
            );
            reveal();
        } catch (error) {
            if (!isCurrent()) return;
            logger.error("refresh failed; showing fallback", error);
            list.replaceChildren(
                createMessageItem("error", container.dataset.loadFailed ?? fallback),
            );
        } finally {
            if (isCurrent()) {
                request = undefined;
                container.removeAttribute("aria-busy");
            }
        }
    };
    let started = false;
    let observer: IntersectionObserver | undefined;
    const start = () => {
        if (started || disposed) return;
        started = true;
        observer?.disconnect();
        observer = undefined;
        void refresh();
    };
    container.querySelector("#refresh-random-posts")?.addEventListener(
        "click",
        (event) => {
            event.preventDefault();
            if (!started) {
                start();
                return;
            }
            void refresh();
        },
        { signal: controller.signal },
    );
    reducedMotion.addEventListener("change", cancelAnimation, { signal: controller.signal });
    if ("IntersectionObserver" in window) {
        // The sidebar sits below the article on phones; do not fetch its index
        // until the reader is close enough to see it.
        observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) start();
            },
            { rootMargin: "300px 0px" },
        );
        observer.observe(container);
    } else {
        start();
    }
    return () => {
        disposed = true;
        revision++;
        request?.abort();
        controller.abort();
        observer?.disconnect();
        cancelAnimation();
        container.removeAttribute("aria-busy");
    };
}

registerPageLifecycle("random-posts", mountRandomPosts);
