import { describe, expect, it, vi } from "vitest";

const installed = vi.hoisted(() => ({ version: "7.4.0" }));
vi.mock("astro/package.json", () => ({ default: installed }));

import { markdownPropagationPlugin } from "../src/internal/markdown-propagation";

describe("Markdown propagation compatibility gate", () => {
    it.each([
        ["7.4.0", "build", true],
        ["7.4.0", "serve", false],
        ["7.3.8", "build", false],
        ["7.4.1", "build", false],
        ["7.5.0", "build", false],
        ["8.0.0", "build", false],
    ] as const)(
        "uses the original pipeline for unverified Astro versions and dev: %s %s",
        (version, command, enabled) => {
            installed.version = version;
            const { apply } = markdownPropagationPlugin();
            if (typeof apply !== "function") throw new Error("Missing compatibility gate");
            expect(apply({}, { command, mode: "production" })).toBe(enabled);
        },
    );
});
