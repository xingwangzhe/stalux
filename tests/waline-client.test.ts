import { afterEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock("@waline/client", () => ({ init: api.init }));
vi.mock("@waline/client/style?inline", () => ({ default: "" }));
vi.mock("../src/styles/generated-waline.css?inline", () => ({ default: "" }));

import { mountWaline } from "../src/scripts/waline-client";

function setup() {
    const style = { dataset: {}, textContent: "", remove: vi.fn() };
    const element = {} as HTMLElement;
    const destroy = vi.fn();
    vi.stubGlobal("window", { location: { pathname: "/posts/current/" } });
    vi.stubGlobal("document", { createElement: () => style, head: { append: vi.fn() } });
    api.init.mockReset().mockReturnValue({ el: element, destroy });
    return { style, element, destroy };
}
afterEach(() => vi.unstubAllGlobals());
describe("Waline mounting", () => {
    it.each([undefined, "", "   "])("uses current page for an empty path (%s)", (path) => {
        const { element } = setup();
        mountWaline({ serverURL: "https://example.com", path }, element);
        expect(api.init).toHaveBeenCalledWith(
            expect.objectContaining({ path: "/posts/current/", el: element }),
        );
    });
    it("preserves an explicit custom path", () => {
        const { element } = setup();
        mountWaline({ path: "/custom/" }, element);
        expect(api.init).toHaveBeenCalledWith(expect.objectContaining({ path: "/custom/" }));
    });
    it("removes injected CSS when init fails", () => {
        const { style, element } = setup();
        api.init.mockImplementation(() => {
            throw new Error("mount");
        });
        expect(() => mountWaline({}, element)).toThrow("mount");
        expect(style.remove).toHaveBeenCalledOnce();
    });
    it("removes injected CSS even when destroy fails", () => {
        const { style, element, destroy } = setup();
        const dispose = mountWaline({}, element);
        destroy.mockImplementation(() => {
            throw new Error("unmount");
        });
        expect(dispose).toThrow("unmount");
        expect(style.remove).toHaveBeenCalledOnce();
    });
});
