import { defineConfig, presetWind3, type StaticShortcut, transformerDirectives } from "unocss";
import { componentRules } from "./src/styles/features.ts";
import { componentShortcuts } from "./src/styles/shortcuts.ts";

export default defineConfig({
    presets: [presetWind3({ preflight: false })],
    theme: {
        colors: {
            ink: Object.fromEntries(
                [
                    "full",
                    "95",
                    "90",
                    "85",
                    "80",
                    "78",
                    "75",
                    "70",
                    "60",
                    "50",
                    "40",
                    "30",
                    "20",
                    "15",
                    "10",
                    "05",
                ].map((key) => [key, `var(--white-${key === "full" ? key : `${key}p`})`]),
            ),
        },
        spacing: Object.fromEntries(
            ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"].map((key) => [
                key,
                `var(--space-${key})`,
            ]),
        ),
        borderRadius: Object.fromEntries(
            ["sm", "md", "lg", "full"].map((key) => [`stalux-${key}`, `var(--radius-${key})`]),
        ),
    },
    transformers: [transformerDirectives({ throwOnMissing: true })],
    content: { filesystem: ["src/{components,layouts,pages,scripts}/**/*.{astro,ts}"] },
    outputToCssLayers: { cssLayerName: (layer) => (layer === "default" ? "utilities" : layer) },
    layers: { components: -1, default: 0 },
    rules: [
        ["stalux-glass", { background: "var(--surface-glass)" }],
        ["stalux-glow", { "text-shadow": "var(--stalux-text-shadow)" }],
        ["shadow-stalux", { "box-shadow": "var(--card-box-shadow)" }],
        // Named Wind3 font sizes also set line-height; these preserve the inherited line-height.
        ...["subtitle", "base", "small", "smaller", "tiny"].map(
            (key): import("unocss").StaticRule => [
                `text-stalux-${key}`,
                { "font-size": `var(--font-size-${key})` },
            ],
        ),
        ...componentRules,
    ],
    shortcuts: [
        ["stalux-flex-center", "flex items-center justify-center"],
        ["stalux-flex-row", "flex items-center"],
        ["stalux-stack", "flex flex-col"],
        ["stalux-list-reset", "list-none m-0 p-0"],
        ["stalux-list-bare", "list-none p-0"],
        ...Object.entries(componentShortcuts).map(
            ([name, utilities]): StaticShortcut => [name, utilities, { layer: "components" }],
        ),
    ],
});
