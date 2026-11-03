import { createRequire } from "node:module";

export interface SharpRawBuffer {
    data: Buffer;
    info: { width: number; height: number; channels: number };
}

export interface SharpPipeline {
    rotate: () => SharpPipeline;
    resize: (options: Record<string, unknown>) => SharpPipeline;
    flatten: (options: Record<string, unknown>) => SharpPipeline;
    removeAlpha: () => SharpPipeline;
    composite: (images: Record<string, unknown>[]) => SharpPipeline;
    greyscale: () => SharpPipeline;
    toColourspace: (colourspace: string) => SharpPipeline;
    raw: () => SharpPipeline;
    jpeg: (options: Record<string, unknown>) => SharpPipeline;
    png: (options: Record<string, unknown>) => SharpPipeline;
    toBuffer(): Promise<Buffer>;
    toBuffer(options: { resolveWithObject: true }): Promise<SharpRawBuffer>;
}

export type SharpFactory = (input: Buffer) => SharpPipeline;

let cached: { factory: SharpFactory | undefined } | undefined;

/**
 * `sharp` is optional: it ships with Astro and is a dev dependency of the theme,
 * but a project using another image service must still be able to build. It is
 * loaded with `require` because the Vite module runner may already be closed and
 * because a bare dynamic import would make the bundler resolve it eagerly.
 */
export function loadSharp(): SharpFactory | undefined {
    if (cached) return cached.factory;
    let factory: SharpFactory | undefined;
    try {
        const loaded = createRequire(import.meta.url)("sharp") as { default?: unknown };
        const candidate = (loaded.default ?? loaded) as unknown;
        if (typeof candidate === "function") factory = candidate as SharpFactory;
    } catch {
        factory = undefined;
    }
    cached = { factory };
    return factory;
}
