import { productionStyleName } from "./style-name.ts";

const ACCENT_COLOR_PATTERN = /^#[\da-fA-F]{6}$/u;

const ACCENT_OPACITIES = [90, 85, 80, 70, 60, 50, 40, 30, 20] as const;

/** Page canvas the accent text has to stay legible on (see `--stalux-bg-color`). */
const CANVAS_LUMINANCE = relativeLuminance([32, 32, 32]);

/** WCAG AA for normal text is 4.5:1; keep a small margin for translucent surfaces. */
const MIN_TEXT_CONTRAST = 4.6;

function linearChannel(value: number): number {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([red, green, blue]: readonly number[]): number {
    return (
        0.2126 * linearChannel(red ?? 0) +
        0.7152 * linearChannel(green ?? 0) +
        0.0722 * linearChannel(blue ?? 0)
    );
}

function contrastOnCanvas(color: readonly number[]): number {
    const luminance = relativeLuminance(color);
    const [lighter, darker] =
        luminance > CANVAS_LUMINANCE
            ? [luminance, CANVAS_LUMINANCE]
            : [CANVAS_LUMINANCE, luminance];
    return (lighter + 0.05) / (darker + 0.05);
}

function toHex([red, green, blue]: readonly number[]): string {
    return `#${[red, green, blue]
        .map((value) => (value ?? 0).toString(16).padStart(2, "0"))
        .join("")}`;
}

/**
 * Lighten the accent toward white until it clears WCAG AA as body text.
 * Accents that already pass keep their exact value, so default themes are unchanged.
 */
export function accentTextColor(accentColor: string): string {
    const hex = accentColor.slice(1);
    const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
    if (contrastOnCanvas(channels) >= MIN_TEXT_CONTRAST) return accentColor.toLowerCase();

    for (let step = 1; step <= 20; step++) {
        const mix = step / 20;
        const lifted = channels.map((value) => Math.round(value + (255 - value) * mix));
        if (contrastOnCanvas(lifted) >= MIN_TEXT_CONTRAST) return toHex(lifted);
    }
    return "#ffffff";
}

/** Build the CSS custom properties shared by Stalux and its comment styles. */
export function getAccentColorStyle(accentColor = "#EAB308"): string {
    if (!ACCENT_COLOR_PATTERN.test(accentColor)) {
        throw new Error(`Invalid Stalux accent color "${accentColor}". Expected #RRGGBB.`);
    }

    const hex = accentColor.slice(1);
    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    const rgb = `${red} ${green} ${blue}`;

    return [
        `--stalux-accent-color: ${accentColor.toLowerCase()}`,
        `--stalux-accent-rgb: ${rgb}`,
        `--accent-text: ${accentTextColor(accentColor)}`,
        ...ACCENT_OPACITIES.map(
            (opacity) =>
                `${productionStyleName(`--accent-${opacity}p`)}: rgb(${red} ${green} ${blue} / ${opacity / 100})`,
        ),
    ].join("; ");
}
