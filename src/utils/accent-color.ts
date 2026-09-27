const ACCENT_COLOR_PATTERN = /^#[\da-fA-F]{6}$/;

const ACCENT_OPACITIES = [90, 85, 80, 70, 60, 50, 40, 30, 20] as const;

/** Build the CSS custom properties shared by Stalux and its comment styles. */
export function getAccentColorStyle(accentColor = "#EAB308"): string {
    if (!ACCENT_COLOR_PATTERN.test(accentColor)) {
        throw new Error(`Invalid Stalux accent color "${accentColor}". Expected #RRGGBB.`);
    }

    const hex = accentColor.slice(1);
    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    const rgb = `${red}, ${green}, ${blue}`;

    return [
        `--stalux-accent-color: ${accentColor.toLowerCase()}`,
        `--stalux-accent-rgb: ${rgb}`,
        ...ACCENT_OPACITIES.map(
            (opacity) => `--accent-${opacity}p: rgba(${rgb}, ${opacity / 100})`,
        ),
    ].join("; ");
}
