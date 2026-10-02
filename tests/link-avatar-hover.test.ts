import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const linkCardStyles = readFileSync(
    new URL("../src/styles/theme/link-cards.css", import.meta.url),
    "utf8",
);

describe("link card avatar hover motion", () => {
    it("spins the avatar once when the card is hovered", () => {
        expect(linkCardStyles).toMatch(
            /\.stalux-link-card:hover \.stalux-link-card-avatar img\s*\{[^}]*animation:\s*stalux-link-avatar-spin 700ms ease-in-out 1;/u,
        );
        expect(linkCardStyles).toMatch(
            /@keyframes stalux-link-avatar-spin\s*\{[\s\S]*?from\s*\{\s*transform:\s*rotate\(0deg\) scale\(1\.04\);\s*\}[\s\S]*?to\s*\{\s*transform:\s*rotate\(360deg\) scale\(1\.04\);/u,
        );
    });

    it("disables the spin for reduced-motion preferences", () => {
        expect(linkCardStyles).toMatch(
            /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.stalux-link-card:hover \.stalux-link-card-avatar img\s*\{\s*animation:\s*none;\s*transform:\s*none;\s*transition:\s*none;/u,
        );
    });
});
