import type { OramaSearchBox } from "@orama/wc-components/dist/components/orama-search-box.js";
import { escape as escapeHtml } from "html-escaper";
import {
    searchInput,
    searchParameters,
    searchVector,
    selectSearchHits,
} from "../utils/orama-search";
import { toRoutePath } from "../utils/public-routes";
import { sitePath } from "../utils/site-path";
import { navigate } from "./navigation-client";
import { loadOramaSearch } from "./orama-client";

let pending: Promise<Awaited<ReturnType<typeof loadOramaSearch>>> | undefined;

const metadataBadge = `display:inline-flex;align-items:center;max-inline-size:100%;box-sizing:border-box;padding:.2em .55em;border:1px solid var(--stalux-label-border);border-radius:.45em;overflow-wrap:anywhere;color:var(--stalux-label-ink);background:var(--tag-bg)`;
const metadataLink = `${metadataBadge};text-decoration:none`;

function taxonomyHref(type: "categories" | "tags", value: string) {
    return escapeHtml(sitePath(toRoutePath(`/${type}/${encodeURIComponent(value)}`)));
}

function attachResultMetadata(root: ShadowRoot) {
    const observer = new MutationObserver(() => {
        for (const template of root.querySelectorAll<HTMLTemplateElement>(
            "template[data-stalux-search-metadata]",
        )) {
            const article = template.closest("a");
            if (!article) continue;
            if (article.nextElementSibling?.hasAttribute("data-stalux-search-actions"))
                article.nextElementSibling.remove();
            // Orama wraps the excerpt in the article link. Insert independent links beside it.
            article.after(template.content);
            template.remove();
        }
    });
    observer.observe(root, { childList: true, subtree: true });
}

function enableModalClose(root: ShadowRoot, template: HTMLTemplateElement) {
    const label = template.dataset.searchClose;
    const icon = template.content.querySelector("svg[data-search-close-icon]");
    const style = document.createElement("style");
    style.textContent = `
        orama-modal button.modal-close > svg { display: none }
        @media (width <= 1024px) {
            orama-modal .search-form {
                padding-inline-end: calc(3.25rem + env(safe-area-inset-right));
                padding-block-start: env(safe-area-inset-top);
            }
            orama-modal dialog.modal.open .modal-inner > button.modal-close {
                position: fixed;
                inset-block-start: calc(1rem + env(safe-area-inset-top));
                inset-inline-end: calc(1rem + env(safe-area-inset-right));
                z-index: 1;
                display: grid;
                place-items: center;
                clip: auto;
                clip-path: none;
                inline-size: 3rem;
                block-size: 3.125rem;
                min-inline-size: 44px;
                min-block-size: 44px;
                padding: 0;
                font: inherit;
                color: var(--text-color-secondary, var(--text-color-primary));
                background: var(--background-color-secondary);
                border: 1px solid var(--border-color-primary);
                border-radius: .75rem;
                cursor: pointer;
            }
            orama-modal button.modal-close > svg { display: block }
            orama-modal button.modal-close > span { display: none }
            orama-modal button.modal-close:is(:hover, :focus-visible) {
                color: var(--text-color-primary);
                background: var(--background-color-accent);
                border-color: var(--border-color-accent);
            }
            orama-modal button.modal-close:focus-visible {
                outline: 2px solid var(--border-color-accent);
                outline-offset: 2px;
            }
        }
    `;
    root.append(style);
    let restoreFocus = false;
    root.addEventListener(
        "modalClosed",
        () => {
            restoreFocus = true;
        },
        { capture: true },
    );
    const observer = new MutationObserver(() => {
        const button = root.querySelector("orama-modal button.modal-close");
        if (!button && restoreFocus) {
            restoreFocus = false;
            if (!root.host.isConnected) return;
            const opener = document.querySelector<HTMLElement>('[data-ref="stalux-search-btn"]');
            if (opener?.checkVisibility()) opener.focus();
            else document.querySelector<HTMLElement>('[data-ref="stalux-nav-toggle"]')?.focus();
        }
        if (!button || button.hasAttribute("aria-label")) return;
        if (!(label && icon)) return;
        const text = document.createElement("span");
        text.textContent = label;
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
        button.replaceChildren(text, icon.cloneNode(true));
    });
    observer.observe(root, { childList: true, subtree: true });
}

function highlight(text: string, terms: string[]): string {
    const escaped = terms
        .filter(Boolean)
        .toSorted((a, b) => b.length - a.length)
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"));
    if (escaped.length === 0) return escapeHtml(text);
    const pattern = new RegExp(escaped.join("|"), "giu");
    let html = "";
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
        html += escapeHtml(text.slice(cursor, match.index));
        html += `<mark style="color:var(--stalux-label-ink);background:var(--category-bg-hover);border-radius:.2em">${escapeHtml(match[0])}</mark>`;
        cursor = match.index + match[0].length;
    }
    return html + escapeHtml(text.slice(cursor));
}

function excerpt(content: string, description: string, terms: string[]) {
    const normalized = content.toLowerCase();
    const position = terms
        .map((term) => normalized.indexOf(term))
        .filter((index) => index >= 0)
        .sort((a, b) => a - b)[0];
    if (position === undefined) return highlight(description || content.slice(0, 200), terms);
    const start = Math.max(0, position - 45);
    const end = Math.min(content.length, start + 200);
    return `${start ? "…" : ""}${highlight(content.slice(start, end), terms)}${end < content.length ? "…" : ""}`;
}

async function loadSearchUi(clockIcon: string) {
    const [component, index, { default: stylesheet }] = await Promise.all([
        import("@orama/wc-components/dist/components/orama-search-box.js"),
        loadOramaSearch(import.meta.env.BASE_URL),
        import("@orama/wc-components/dist/orama-ui/orama-ui.css?inline"),
    ]);
    const style = document.createElement("style");
    style.textContent = stylesheet.replace(
        /^\s*@import\s*(?:url\([^)]*\)|"[^"]*"|'[^']*')\s*;/u,
        "",
    );
    document.head.append(style);
    const { database, cjk, count } = index;
    const searchTerms = new WeakMap<object, string[]>();
    database.beforeSearch.push((_db, params) => {
        const { term, quoted, terms } = searchInput(params.term ?? "");
        searchTerms.set(params, terms);
        Object.assign(
            params,
            searchParameters(term, document.documentElement.lang.toLowerCase(), count),
        );
        if (params.mode === "hybrid") {
            params.vector = { property: "embedding", value: searchVector(term, cjk) };
            params.similarity = quoted ? 2 : 0.25;
            params.hybridWeights = { text: 0.85, vector: 0.15 };
        }
    });
    database.afterSearch.push((_db, params, _language, results) => {
        const terms = searchTerms.get(params) ?? [];
        const hits = selectSearchHits(results.hits, terms);
        results.count = hits.length;
        results.hits = hits.map((hit) => {
            const record = hit.document;
            const date = record.publishedDate;
            const metadata = [
                date
                    ? `<time datetime="${escapeHtml(date)}" style="${metadataBadge};gap:.4em;font-variant-numeric:tabular-nums">${clockIcon}${escapeHtml(date.slice(0, 16).replace("T", " "))}</time>`
                    : "",
                record.category
                    ? `<a href="${taxonomyHref("categories", record.category)}" style="${metadataLink};background:var(--category-bg);font-weight:600">${escapeHtml(record.category)}</a>`
                    : "",
                ...[...new Set(record.tags ?? [])].map(
                    (tag) =>
                        `<a href="${taxonomyHref("tags", String(tag))}" style="${metadataLink}">#${escapeHtml(String(tag))}</a>`,
                ),
            ]
                .filter(Boolean)
                .join("");
            return {
                ...hit,
                document: {
                    ...record,
                    title: `<span style="white-space:normal">${highlight(record.title, terms)}</span>`,
                    description:
                        `<span style="white-space:normal">${excerpt(record.content, record.description, terms)}</span>` +
                        (metadata
                            ? `<template data-stalux-search-metadata><div data-stalux-search-actions style="display:flex;flex-wrap:wrap;gap:.375rem;white-space:normal;margin:0 .75rem .65rem 2.75rem;font-size:.9375rem;line-height:1.4">${metadata}</div></template>`
                            : ""),
                },
            };
        });
    });
    component.defineCustomElement();
    return index;
}

export function closeSearchDialog() {
    const box = document.querySelector<InstanceType<typeof OramaSearchBox>>(
        "orama-search-box[data-stalux-search]",
    );
    if (box) box.open = false;
}

export async function openSearchDialog(signal: AbortSignal) {
    const anchor = document.querySelector<HTMLTemplateElement>("template[data-stalux-search]");
    if (!anchor || signal.aborted) return;
    const existing = document.querySelector<InstanceType<typeof OramaSearchBox>>(
        "orama-search-box[data-stalux-search]",
    );
    if (existing) {
        existing.open = true;
        return;
    }
    const clockIcon = anchor.content.querySelector("svg[data-search-clock]")?.outerHTML ?? "";
    pending ??= loadSearchUi(clockIcon).catch((error: unknown) => {
        pending = undefined;
        throw error;
    });
    const { database } = await pending;
    if (
        signal.aborted ||
        !anchor.isConnected ||
        document.querySelector("orama-search-box[data-stalux-search]")
    )
        return;
    const prototype = anchor.content.querySelector("orama-search-box");
    if (!prototype) return;
    const box = document.importNode(prototype, true) as InstanceType<typeof OramaSearchBox>;
    box.layout = "modal";
    box.disableChat = true;
    box.colorScheme = "dark";
    box.themeConfig = {
        colors: {
            dark: {
                "--background-color-accent": "var(--category-bg-hover)",
                "--border-color-accent": "var(--stalux-label-border)",
                "--text-color-accent": "var(--accent-text)",
            },
        },
    };
    box.linksTarget = "_self";
    box.clientInstance = database;
    box.searchParams = {
        mode: "hybrid",
        term: "",
        vector: { property: "embedding", value: [] },
    };
    box.resultMap = { path: "url" };
    const dictionary = anchor.dataset.searchDictionary;
    if (dictionary) box.dictionary = JSON.parse(dictionary);
    if (box.shadowRoot) {
        attachResultMetadata(box.shadowRoot);
        enableModalClose(box.shadowRoot, anchor);
    }
    box.shadowRoot?.addEventListener(
        "error",
        (event) => {
            const logo = event.target;
            if (!(logo instanceof HTMLImageElement && logo.closest("orama-footer"))) return;
            const label = document.createElement("strong");
            label.textContent = "Orama";
            logo.replaceWith(label);
        },
        { capture: true },
    );
    box.addEventListener("click", (event) => {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        )
            return;
        const anchor = event.composedPath().find((node) => node instanceof HTMLAnchorElement);
        if (!anchor || anchor.origin !== location.origin) return;
        event.preventDefault();
        box.open = false;
        navigate(anchor.href);
    });
    anchor.after(box);
    box.open = true;
}
