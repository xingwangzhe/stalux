import { TagCloud } from "@xingwangzhe/tags-cloud";

import { registerPageLifecycle } from "./page-runtime";

interface LinkTag {
    type: "link";
    text: string;
    url: string;
}

function parseTags(value: string | undefined): LinkTag[] {
    try {
        const parsed: unknown = JSON.parse(value ?? "[]");
        if (!Array.isArray(parsed)) return [];
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
        return [];
    }
}

registerPageLifecycle("tags-cloud", () => {
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    if (mobile) return;

    const container = document.getElementById("tags-canvas");
    if (!container) return;
    const rawTags = parseTags(container.dataset.tags);
    if (rawTags.length === 0) return;
    const tags = rawTags.map((tag) => ({
        ...tag,
        onClick: () => {
            window.location.href = tag.url;
        },
    }));
    const width = container.getBoundingClientRect().width;
    const baseRadius = window.innerWidth < 1_024 ? 330 : window.innerWidth < 1_440 ? 420 : 480;
    const densityScale = Math.sqrt(Math.max(tags.length, 100) / 100);
    const radius = Math.min(Math.round(baseRadius * densityScale), Math.round(width * 0.6));
    container.style.height = `${Math.round(radius * 2)}px`;
    const cloud = new TagCloud(container, {
        tags,
        radius,
        spinY: 0.15,
        fontSize: 16,
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
    });
    return () => cloud.destroy();
});
