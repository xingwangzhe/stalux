import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("../src/styles/generated-links.css", import.meta.url), "utf8");
const motion = readFileSync(new URL("../src/styles/generated.css", import.meta.url), "utf8");

describe("compiled link card avatar motion", () => {
    it("spins the avatar once when its stable avatar container is hovered", () => {
        expect(styles).toMatch(
            /\.stalux-link-card-avatar:hover img\{[^}]*animation:\.65s ease-in-out stalux-link-avatar-spin[;}]/u,
        );
        expect(motion).toMatch(
            /@keyframes stalux-link-avatar-spin\{0%\{transform:rotate\(0\)\}to\{transform:rotate\(360deg\)\}\}/u,
        );
    });

    it("disables hover motion for reduced-motion preferences", () => {
        expect(styles).toMatch(
            /@media\s*\(prefers-reduced-motion:reduce\) and \(hover:hover\) and \(pointer:fine\)\{\.stalux-link-card-avatar:hover img\{transition:none;animation:none;transform:none\}/u,
        );
    });
});
