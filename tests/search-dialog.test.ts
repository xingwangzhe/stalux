// @vitest-environment happy-dom

import { expect, it, vi } from "vitest";
import { openSearchDialog } from "../src/scripts/search-dialog";

const setup = vi.hoisted(() => ({
    loadOramaSearch: vi.fn(async () => ({
        database: { beforeSearch: [], afterSearch: [] },
        count: 3,
        cjk: true,
    })),
    defineCustomElement: vi.fn(),
}));
vi.mock("../src/scripts/search-engine", () => ({ loadOramaSearch: setup.loadOramaSearch }));
vi.mock("@orama/wc-components/dist/components/orama-search-box.js", () => ({
    defineCustomElement: setup.defineCustomElement,
}));

it("mounts the official Orama search box into an open native dialog once", async () => {
    document.body.innerHTML = `<dialog id="search" lang="zh-CN"><p data-search-status data-loading="加载中"></p></dialog>`;
    const dialog = document.querySelector("dialog");
    const signal = new AbortController().signal;
    await Promise.all([openSearchDialog(signal), openSearchDialog(signal)]);
    expect(dialog?.open).toBe(true);
    expect(dialog?.querySelectorAll("orama-search-box")).toHaveLength(1);
    expect(setup.loadOramaSearch).toHaveBeenCalledTimes(1);
    expect(setup.defineCustomElement).toHaveBeenCalledTimes(1);
});

it("keeps a dialog closed when opening was cancelled by navigation", async () => {
    document.body.innerHTML = `<dialog id="search"></dialog>`;
    const signal = AbortSignal.abort();
    await openSearchDialog(signal);
    expect(document.querySelector("dialog")?.open).toBe(false);
});
