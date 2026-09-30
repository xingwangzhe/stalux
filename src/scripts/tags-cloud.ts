import { navigate } from "astro:transitions/client";
import { createClientLogger } from "./logger";

import { registerPageLifecycle } from "./page-runtime";

const logger = createClientLogger("tags-cloud");

interface LinkTag {
    type: "link";
    text: string;
    url: string;
}

function parseTags(value: string | undefined): LinkTag[] {
    try {
        const parsed: unknown = JSON.parse(value ?? "[]");
        if (!Array.isArray(parsed)) {
            logger.warn("tag data is not an array; using empty list");
            return [];
        }
        return parsed.filter(
            (tag): tag is LinkTag =>
                typeof tag === "object" &&
                tag !== null &&
                "type" in tag &&
                tag.type === "link" &&
                "text" in tag &&
                typeof tag.text === "string" &&
                "url" in tag &&
                typeof tag.url === "string",
        );
    } catch {
        logger.warn("tag data decoding failed; using empty list");
        return [];
    }
}

registerPageLifecycle("tags-cloud", () => {
    const container = document.getElementById("tags-canvas");
    if (!container) return;
    const desktop = window.matchMedia("(min-width: 769px)");
    const controller = new AbortController();
    let cloud: import("@xingwangzhe/tags-cloud").TagCloud | undefined;
    let visible = false;
    let loading = false;
    let disposed = false;
    const active = () => !disposed && desktop.matches && visible && !document.hidden;
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
            const tags = parseTags(container.dataset.tags).map((tag) => ({
                ...tag,
                onClick: () => {
                    void navigate(tag.url);
                },
            }));
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
                color: "#ffffff",
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
    document.addEventListener("visibilitychange", update, { signal: controller.signal });
    return () => {
        disposed = true;
        controller.abort();
        observer.disconnect();
        cloud?.destroy();
    };
});
