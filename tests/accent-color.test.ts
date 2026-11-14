import { describe, expect, it } from "vitest";
import { accentTextColor, getAccentColorStyle } from "../src/utils/accent-color";

function linear(channel: number): number {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
    const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((offset) =>
        Number.parseInt(hex.slice(offset, offset + 2), 16),
    );
    return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

/** Contrast of `hex` against the Stalux dark canvas (#202020). */
function contrastOnCanvas(hex: string): number {
    const [lighter, darker] = [luminance(hex), luminance("#202020")].sort((a, b) => b - a) as [
        number,
        number,
    ];
    return (lighter + 0.05) / (darker + 0.05);
}

describe("accent text colour", () => {
    it("keeps an accent that already clears WCAG AA untouched", () => {
        expect(accentTextColor("#EAB308")).toBe("#eab308");
    });

    it("lightens a low-contrast accent until body text reaches AA", () => {
        const lifted = accentTextColor("#3F8474");
        expect(lifted).toMatch(/^#[\da-f]{6}$/u);
        expect(lifted).not.toBe("#3f8474");
        expect(contrastOnCanvas(lifted)).toBeGreaterThanOrEqual(4.5);
    });

    it("exposes the token next to the accent colour", () => {
        const style = getAccentColorStyle("#3F8474");
        expect(style).toContain("--stalux-accent-color: #3f8474");
        expect(style).toContain(`--accent-text: ${accentTextColor("#3F8474")}`);
    });

    it("rejects malformed accent colours", () => {
        expect(() => getAccentColorStyle("#fff")).toThrow("Invalid Stalux accent color");
    });
});
