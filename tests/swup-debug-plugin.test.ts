import { beforeEach, describe, expect, it, vi } from "vitest";
import { swupDebugPlugin } from "../src/internal/swup-debug-plugin";

const resolution = vi.hoisted(() => vi.fn());
const manifestRead = vi.hoisted(() => vi.fn());
vi.mock("node:module", () => ({ createRequire: () => ({ resolve: resolution }) }));
vi.mock("node:fs", async (importOriginal) => ({
    ...(await importOriginal<typeof import("node:fs")>()),
    readFileSync: manifestRead,
}));

function load(development: boolean) {
    const plugin = swupDebugPlugin(development);
    const resolveId = plugin.resolveId as (id: string) => string | undefined;
    const loader = plugin.load as (id: string) => string | undefined;
    return loader(resolveId("virtual:stalux-swup-debug") ?? "");
}

describe("optional Swup dev diagnostics", () => {
    beforeEach(() => {
        resolution.mockReset();
        manifestRead.mockReset();
        manifestRead.mockReturnValue(
            JSON.stringify({ exports: { ".": { import: "./dist/index.modern.js" } } }),
        );
    });

    it("does not resolve or expose the devDependency in production", () => {
        expect(load(false)).toBe("export default null;");
        expect(resolution).not.toHaveBeenCalled();
    });

    it("uses the ESM entry instead of the CJS build for source development", () => {
        resolution.mockReturnValue("/theme/node_modules/@swup/debug-plugin/dist/index.cjs");
        const code = load(true);
        // Vite cannot re-export a default from the CJS build in the browser.
        expect(code).toContain("/theme/node_modules/@swup/debug-plugin/dist/index.modern.js");
        expect(code).not.toContain("index.cjs");
    });

    it("lets a published consumer develop without installing theme devDependencies", () => {
        resolution.mockImplementation(() => {
            throw new Error("MODULE_NOT_FOUND");
        });
        expect(load(true)).toBe("export default null;");
    });
});
