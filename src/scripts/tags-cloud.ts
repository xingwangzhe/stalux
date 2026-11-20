import { createClientLogger } from "./logger";
import { navigate } from "./navigation-client";

import { registerPageLifecycle } from "./page-runtime";

const logger = createClientLogger("tags-cloud");

function readTagLinks(cards: HTMLElement | null) {
    const tags = [];
    for (const link of cards?.querySelectorAll<HTMLAnchorElement>("[data-stalux-tag-card]") ?? []) {
        const url = link.getAttribute("href");
        const text = link.firstElementChild?.textContent?.trim();
        if (!(url && text)) continue;
        tags.push({
            type: "link" as const,
            text,
            url,
            onClick: () => {
                void navigate(url);
            },
        });
    }
    return tags;
}

export function mountTagsCloud(): (() => void) | undefined {
    const container = document.getElementById("tags-canvas");
    if (!container) return;
    const cards = document.getElementById("tags-cards");
    const desktop = window.matchMedia("(min-width: 769px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const controller = new AbortController();
    let cloud: import("@xingwangzhe/tags-cloud").TagCloud | undefined;
    let tags: ReturnType<typeof readTagLinks> | undefined;
    let visible = false;
    let loading = false;
    let disposed = false;
    const active = () =>
        !disposed && desktop.matches && !reducedMotion.matches && visible && !document.hidden;
    const update = async () => {
        if (!active()) {
            // destroy also cancels the library's rAF; pause() only skips drawing.
            cloud?.destroy();
            cloud = undefined;
            return;
        }
        if (cloud || loading) return;
        loading = true;
        try {
            const { TagCloud } = await import("@xingwangzhe/tags-cloud");
            if (!active()) return;
            tags ??= readTagLinks(cards);
            if (!tags.length) return;
            const width = container.clientWidth;
            const baseRadius =
                window.innerWidth < 1_024 ? 330 : window.innerWidth < 1_440 ? 420 : 480;
            const radius = Math.min(
                Math.round(baseRadius * Math.sqrt(Math.max(tags.length, 100) / 100)),
                Math.round(width * 0.6),
            );
            cloud = new TagCloud(container, {
                tags,
                radius,
                spinY: 0.15,
                fontSize: 16,
                color: getComputedStyle(container).color,
                fontFamily: "system-ui, -apple-system, sans-serif",
            });
        } catch (error) {
            logger.warn(`tag cloud loading failed: ${String(error)}`);
        } finally {
            loading = false;
        }
    };
    const observer = new IntersectionObserver(
        (entries) => {
            visible = entries.some((entry) => entry.isIntersecting);
            void update();
        },
        { rootMargin: "200px 0px" },
    );
    observer.observe(container);
    desktop.addEventListener("change", update, { signal: controller.signal });
    reducedMotion.addEventListener("change", update, { signal: controller.signal });
    document.addEventListener("visibilitychange", update, { signal: controller.signal });
    return () => {
        disposed = true;
        controller.abort();
        observer.disconnect();
        cloud?.destroy();
    };
}

registerPageLifecycle("tags-cloud", mountTagsCloud);
