import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("../src/styles/generated-links.css", import.meta.url), "utf8");

describe("compiled link card avatar motion", () => {
    it("gives the avatar a bounded tilt when its stable container is hovered", () => {
        expect(styles).toMatch(
            /\.stalux-link-card-avatar:hover img\{[^}]*transform:rotate\(3deg\)[;}]/u,
        );
        expect(styles).not.toMatch(/animation:[^}]*stalux-link-avatar-spin/u);
    });

    it("disables hover motion for reduced-motion preferences", () => {
        expect(styles).toMatch(
            /@media\s*\(prefers-reduced-motion:reduce\) and \(hover:hover\) and \(pointer:fine\)\{\.stalux-link-card-avatar:hover img\{transition:none;animation:none;transform:none\}/u,
        );
    });
});
