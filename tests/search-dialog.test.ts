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

it("opens exactly one official Orama modal without a wrapper", async () => {
    document.body.innerHTML = `<template data-stalux-search data-search-dictionary='{"searchPlaceholder":"Localized search","noResultsFound":"Localized empty state"}'><orama-search-box data-stalux-search></orama-search-box></template>`;
    const signal = new AbortController().signal;
    await Promise.all([openSearchDialog(signal), openSearchDialog(signal)]);
    expect(document.querySelectorAll("orama-search-box")).toHaveLength(1);
    expect(document.querySelector("orama-search-box")).toMatchObject({
        layout: "modal",
        open: true,
        colorScheme: "dark",
        dictionary: {
            searchPlaceholder: "Localized search",
            noResultsFound: "Localized empty state",
        },
    });
    expect(document.querySelector("dialog")).toBeNull();
    expect(setup.loadOramaSearch).toHaveBeenCalledTimes(1);
    expect(setup.defineCustomElement).toHaveBeenCalledTimes(1);
});

it("keeps a dialog closed when opening was cancelled by navigation", async () => {
    document.body.innerHTML = "<template data-stalux-search></template>";
    const signal = AbortSignal.abort();
    await openSearchDialog(signal);
    expect(document.querySelector("orama-search-box")).toBeNull();
});
