import { describe, expect, it, vi } from "vitest";
import { swupDebugPlugin } from "../src/internal/swup-debug-plugin";

const resolution = vi.hoisted(() => vi.fn());
vi.mock("node:module", () => ({ createRequire: () => ({ resolve: resolution }) }));

function load(development: boolean) {
    const plugin = swupDebugPlugin(development);
    const resolve = plugin.resolveId as (id: string) => string | undefined;
    const loader = plugin.load as (id: string) => string | undefined;
    return loader(resolve("virtual:stalux-swup-debug") ?? "");
}

describe("optional Swup dev diagnostics", () => {
    it("does not resolve or expose the devDependency in production", () => {
        resolution.mockClear();
        expect(load(false)).toBe("export default null;");
        expect(resolution).not.toHaveBeenCalled();
    });
    it("exposes the installed debug plugin for source development", () => {
        resolution.mockReturnValue("/theme/node_modules/@swup/debug-plugin/dist/index.cjs");
        expect(load(true)).toContain("/theme/node_modules/@swup/debug-plugin/dist/index.cjs");
    });
    it("lets a published consumer develop without installing theme devDependencies", () => {
        resolution.mockImplementation(() => {
            throw new Error("MODULE_NOT_FOUND");
        });
        expect(load(true)).toBe("export default null;");
    });
});
