import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("../src/styles/generated-links.css", import.meta.url), "utf8");
const motion = readFileSync(new URL("../src/styles/generated.css", import.meta.url), "utf8");

describe("compiled link card avatar motion", () => {
    it("spins the avatar once when the card is hovered", () => {
        expect(styles).toMatch(
            /\.stalux-link-card:hover \.stalux-link-card-avatar img\{[^}]*animation:\.7s ease-in-out stalux-link-avatar-spin;/u,
        );
        expect(motion).toMatch(
            /@keyframes stalux-link-avatar-spin\{0%\{transform:rotate\(0\)scale\(1\.04\)\}to\{transform:rotate\(360deg\)scale\(1\.04\)\}\}/u,
        );
    });

    it("disables hover motion for reduced-motion preferences", () => {
        expect(styles).toMatch(
            /@media\s*\(prefers-reduced-motion:reduce\)\{\.stalux-link-card:hover \.stalux-link-card-avatar img\{transition:none;animation:none;transform:none\}/u,
        );
    });
});
