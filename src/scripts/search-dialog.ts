import type { OramaSearchBox } from "@orama/wc-components/dist/components/orama-search-box.js";
import { escape as escapeHtml } from "html-escaper";
import {
    searchInput,
    searchParameters,
    searchVector,
    selectSearchHits,
} from "../utils/orama-search";
import { navigate } from "./navigation-client";
import { loadOramaSearch } from "./search-engine";

let pending: Promise<Awaited<ReturnType<typeof loadOramaSearch>>> | undefined;

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
        html += `<mark>${escapeHtml(match[0])}</mark>`;
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

async function loadSearchUi() {
    const [component, index] = await Promise.all([
        import("@orama/wc-components/dist/components/orama-search-box.js"),
        loadOramaSearch(import.meta.env.BASE_URL),
    ]);
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
                    ? `<time datetime="${escapeHtml(date)}">${escapeHtml(date.slice(0, 16).replace("T", " "))}</time>`
                    : "",
                escapeHtml(record.category ?? ""),
                ...[...new Set(record.tags ?? [])].map((tag) => `#${escapeHtml(String(tag))}`),
            ]
                .filter(Boolean)
                .join(" · ");
            return {
                ...hit,
                document: {
                    ...record,
                    title: highlight(record.title, terms),
                    description:
                        `<span style="white-space:normal">${excerpt(record.content, record.description, terms)}</span>` +
                        (metadata
                            ? `<small style="display:block;white-space:normal">${metadata}</small>`
                            : ""),
                },
            };
        });
    });
    component.defineCustomElement();
    return index;
}

export async function openSearchDialog(signal: AbortSignal) {
    const dialog = document.querySelector<HTMLDialogElement>("dialog#search");
    if (!dialog || signal.aborted) return;
    const status = dialog.querySelector<HTMLElement>("[data-search-status]");
    if (!dialog.open) dialog.showModal();
    const mounted = dialog.querySelector("orama-search-box");
    if (mounted) {
        mounted.shadowRoot?.querySelector("input")?.focus();
        return;
    }
    if (status) {
        status.hidden = false;
        status.textContent = status.dataset.loading ?? "";
    }
    try {
        pending ??= loadSearchUi().catch((error: unknown) => {
            pending = undefined;
            throw error;
        });
        const { database } = await pending;
        if (signal.aborted || !dialog.open || dialog.querySelector("orama-search-box")) return;
        const box = document.createElement("orama-search-box") as InstanceType<
            typeof OramaSearchBox
        >;
        box.layout = "embed";
        box.disableChat = true;
        box.colorScheme = "dark";
        box.linksTarget = "_self";
        box.clientInstance = database;
        box.searchParams = {
            mode: "hybrid",
            term: "",
            vector: { property: "embedding", value: [] },
        };
        box.resultMap = { path: "url" };
        box.searchPlaceholder = dialog.dataset.searchLabel ?? "Search";
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
            dialog.close();
            navigate(anchor.href);
        });
        if (dialog.lang.toLowerCase().startsWith("zh")) {
            box.dictionary = {
                noResultsFound: "未找到相关结果",
                noResultsFoundFor: "关键词",
                startYourSearch: "输入关键词搜索文章",
                errorMessage: "搜索失败，请重试",
            };
        }
        dialog.append(box);
        if (status) status.hidden = true;
        const root = box.shadowRoot;
        if (!root) return;
        const input = root.querySelector("input");
        if (input) {
            input.focus();
            return;
        }
        const observer = new MutationObserver(() => {
            const input = root.querySelector("input");
            if (!input) return;
            observer.disconnect();
            if (dialog.open && dialog.contains(document.activeElement)) input.focus();
        });
        observer.observe(root, { childList: true, subtree: true });
        dialog.addEventListener("close", () => observer.disconnect(), { once: true });
    } catch (error) {
        if (status && !signal.aborted) status.textContent = status.dataset.error ?? "";
        throw error;
    }
}
