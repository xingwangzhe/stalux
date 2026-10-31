import { expect, it } from "vitest";
import {
    badgeAssetId,
    createBadgeAssets,
    generateBadge,
    svgToDataUrl,
} from "../src/utils/badge-generator";

it("shares the same SVG across flat/grouped badges and presentation-only link changes", () => {
    const badge = { label: "Astro", message: "7.4", color: "blue" };
    const assets = createBadgeAssets([
        badge,
        { title: "Tools", items: [{ ...badge, href: "https://astro.build", alt: "Astro" }] },
        { ...badge, message: "8.0" },
    ]);
    expect(assets.size).toBe(2);
    const svg = generateBadge(badge);
    expect(assets.get(badgeAssetId(svg))).toBe(svg);
    expect(assets.has(badgeAssetId(generateBadge({ ...badge, message: "8.0" })))).toBe(true);
});
it("normalizes unknown styles just like footer rendering and preserves custom Data URL support", () => {
    const badge = { label: "中文 & <标签>", message: "100%", style: "unknown" };
    const svg = generateBadge({ ...badge, style: "flat" });
    expect(createBadgeAssets([badge]).get(badgeAssetId(svg))).toBe(svg);
    expect(decodeURIComponent(svgToDataUrl(svg).split(",")[1] ?? "")).toBe(svg);
    expect(svgToDataUrl("")).toBe("");
    expect(createBadgeAssets(undefined).size).toBe(0);
});
