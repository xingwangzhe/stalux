import { createClientLogger } from "./logger";

const logger = createClientLogger("navigation-scripts");
const executions = new Map<string, Promise<void>>();
const executedNodes = new WeakSet<HTMLScriptElement>();
let seeded = false;

interface NavigationScript {
    attributes: { name: string; value: string }[];
    content: string;
    source?: string;
    type: string;
    key: string;
    rerun: boolean;
    head: boolean;
    original: HTMLScriptElement;
}

const JAVASCRIPT_TYPES = new Set([
    "",
    "module",
    "text/javascript",
    "application/javascript",
    "text/ecmascript",
    "application/ecmascript",
]);

function describeScript(script: HTMLScriptElement, base: string): NavigationScript | undefined {
    const type = (script.getAttribute("type") ?? "").trim().toLowerCase();
    if (!JAVASCRIPT_TYPES.has(type) || script.hasAttribute("data-swup-ignore-script")) return;
    if (script.hasAttribute("nomodule") && "noModule" in document.createElement("script")) return;
    const rawSource = script.getAttribute("src");
    let source: string | undefined;
    if (rawSource !== null) {
        try {
            source = new URL(rawSource, base).href;
        } catch {
            return;
        }
    }
    const content = script.textContent ?? "";
    return {
        attributes: [...script.attributes].map(({ name, value }) => ({ name, value })),
        content,
        source,
        type,
        key: source ? `src:${source}` : `inline:${type}:${content}`,
        rerun: script.hasAttribute("data-astro-rerun"),
        head: script.parentElement?.tagName === "HEAD",
        original: script,
    };
}

function seedCurrentScripts(): void {
    if (seeded) return;
    seeded = true;
    for (const script of document.querySelectorAll<HTMLScriptElement>("script")) {
        const descriptor = describeScript(script, document.baseURI);
        if (descriptor) {
            executions.set(descriptor.key, Promise.resolve());
            executedNodes.add(script);
        }
    }
}

function waitForScript(script: HTMLScriptElement, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
        let timer: ReturnType<typeof setTimeout>;
        const finish = (loaded: boolean) => {
            clearTimeout(timer);
            script.removeEventListener("load", loadedHandler);
            script.removeEventListener("error", failedHandler);
            resolve(loaded);
        };
        const loadedHandler = () => finish(true);
        const failedHandler = () => finish(false);
        script.addEventListener("load", loadedHandler, { once: true });
        script.addEventListener("error", failedHandler, { once: true });
        timer = setTimeout(failedHandler, timeoutMs);
    });
}

function abortable(promise: Promise<void>, signal?: AbortSignal): Promise<void> {
    if (!signal) return promise;
    if (signal.aborted) return Promise.resolve();
    return new Promise((resolve) => {
        const finish = () => {
            signal.removeEventListener("abort", finish);
            resolve();
        };
        signal.addEventListener("abort", finish, { once: true });
        void promise.then(finish, finish);
    });
}

function executeScript(descriptor: NavigationScript, timeoutMs: number): Promise<void> {
    // HeadPlugin clones incoming head nodes before container replacement. Those
    // scripts are inert, but are different nodes from the parsed document we
    // captured. Replace that clone rather than appending a second head script.
    const inertCopies = [...document.querySelectorAll<HTMLScriptElement>("script")].filter(
        (candidate) =>
            !executedNodes.has(candidate) &&
            describeScript(candidate, document.baseURI)?.key === descriptor.key,
    );
    const existing = executions.get(descriptor.key);
    if (existing && !descriptor.rerun) {
        for (const copy of inertCopies) copy.remove();
        return existing;
    }

    const script = document.createElement("script");
    // Dynamic scripts are async by default. Preserve document order, including
    // the module barrier used below, before copying the page's attributes.
    script.async = false;
    for (const { name, value } of descriptor.attributes) {
        if (name !== "src" && name !== "data-astro-exec") script.setAttribute(name, value);
    }
    if (descriptor.source) script.setAttribute("src", descriptor.source);
    script.textContent = descriptor.content;
    script.setAttribute("data-astro-exec", "");
    executedNodes.add(script);

    let observed = script;
    if (!descriptor.source && descriptor.type === "module") {
        // Inline module load events are not portable. Astro uses the same
        // ordered external module barrier to wait for deferred inline modules.
        observed = document.createElement("script");
        observed.type = "module";
        observed.async = false;
        observed.src = "data:application/javascript,";
        observed.setAttribute("data-swup-ignore-script", "");
        if (script.nonce) observed.nonce = script.nonce;
    }
    const loaded =
        descriptor.source || descriptor.type === "module"
            ? waitForScript(observed, timeoutMs)
            : Promise.resolve(true);
    const execution = loaded.then((success) => {
        if (observed !== script) observed.remove();
        if (!success) {
            // Failed fetches may succeed on a subsequent visit. Do not turn a
            // transient offline response into a session-long disabled feature.
            if (executions.get(descriptor.key) === execution) executions.delete(descriptor.key);
            script.remove();
            logger.warn(`page script failed to load: ${descriptor.source ?? "inline module"}`);
        }
    });
    executions.set(descriptor.key, execution);

    const parent = descriptor.head ? document.head : document.body;
    const original =
        descriptor.original.isConnected && descriptor.original.ownerDocument === document
            ? descriptor.original
            : inertCopies[0];
    if (original) {
        original.replaceWith(script);
    } else {
        parent.append(script);
    }
    for (const copy of inertCopies) if (copy !== original) copy.remove();
    if (observed !== script) parent.append(observed);
    return execution;
}

/**
 * Capture both head and body before Swup replaces the document's containers.
 * Call the returned function after replacement, before astro:page-load. Bundled
 * modules and ordinary inline scripts retain Astro's once-per-session behavior;
 * data-astro-rerun opts a script into every visit. SDK scripts already present in
 * the first document are never reinserted merely because head metadata changed.
 */
export function prepareNavigationScripts(
    nextDocument: Document,
    options: { timeoutMs?: number; baseUrl?: string } = {},
): (signal?: AbortSignal) => Promise<void> {
    seedCurrentScripts();
    const base = options.baseUrl ?? nextDocument.baseURI ?? document.baseURI;
    const scripts = [...nextDocument.querySelectorAll<HTMLScriptElement>("script")]
        .map((script) => describeScript(script, base))
        .filter((script): script is NavigationScript => script !== undefined);
    let executed: Promise<void> | undefined;
    return (signal) => {
        executed ??= (async () => {
            for (const script of scripts) {
                if (signal?.aborted) return;
                await abortable(executeScript(script, options.timeoutMs ?? 15_000), signal);
            }
        })();
        return executed;
    };
}
