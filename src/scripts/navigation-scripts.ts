import { createClientLogger } from "./logger";

const logger = createClientLogger("navigation-scripts");
const executions = new Map<string, Promise<void>>();
let seeded = false;
const executedNodes = new WeakSet<HTMLScriptElement>();

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
const javascript = new Set([
    "",
    "module",
    "text/javascript",
    "application/javascript",
    "text/ecmascript",
    "application/ecmascript",
]);

/**
 * The theme owns script execution instead of the swup scripts plugin: Astro's
 * page-load event needs an ordered completion barrier and once-per-session
 * semantics. The plugin's whole-document pass would also replay analytics SDKs
 * and the scripts of retained shells on every visit.
 */
function runScript(from: HTMLScriptElement): HTMLScriptElement {
    const script = document.createElement("script");
    for (const { name, value } of from.attributes) script.setAttribute(name, value);
    script.textContent = from.textContent;
    from.replaceWith(script);
    return script;
}

function describeScript(script: HTMLScriptElement, base: string) {
    const type = (script.getAttribute("type") ?? "").trim().toLowerCase();
    if (!javascript.has(type) || script.hasAttribute("data-swup-ignore-script")) return;
    if (script.hasAttribute("nomodule")) return;
    const source = script.getAttribute("src");
    const src = source === null ? undefined : new URL(source, base).href;
    return {
        script,
        src,
        type,
        key: src ? `src:${src}` : `inline:${type}:${script.textContent ?? ""}`,
        rerun:
            script.hasAttribute("data-astro-rerun") ||
            script.hasAttribute("data-swup-reload-script"),
        head: script.parentElement?.tagName === "HEAD",
    };
}

/** Capture before Parallel moves incoming containers out of the parsed document. */
export function prepareNavigationScripts(
    next: Document,
    options: { timeoutMs?: number; baseUrl?: string } = {},
) {
    if (!seeded) {
        seeded = true;
        for (const script of document.querySelectorAll<HTMLScriptElement>("script")) {
            const item = describeScript(script, document.baseURI);
            if (item) {
                executions.set(item.key, Promise.resolve());
                executedNodes.add(script);
            }
        }
    }
    const scripts = [...next.querySelectorAll<HTMLScriptElement>("script")]
        .map((script) =>
            describeScript(script, options.baseUrl ?? next.baseURI ?? document.baseURI),
        )
        .filter((item) => item !== undefined)
        .map((item) => ({
            ...item,
            original: item.script,
            script: item.script.cloneNode(true) as HTMLScriptElement,
        }));
    let execution: Promise<void> | undefined;
    return (signal?: AbortSignal): Promise<void> => {
        execution ??= (async () => {
            for (const item of scripts) {
                if (signal?.aborted) return;
                const existing = executions.get(item.key);
                if (existing && !item.rerun) {
                    for (const copy of document.querySelectorAll<HTMLScriptElement>("script")) {
                        if (
                            !executedNodes.has(copy) &&
                            describeScript(copy, document.baseURI)?.key === item.key
                        )
                            copy.remove();
                    }
                    await abortable(existing, signal);
                    continue;
                }
                const inert = item.script.cloneNode(true) as HTMLScriptElement;
                if (item.src) inert.setAttribute("src", item.src);
                inert.async = false;
                inert.setAttribute("data-astro-exec", "");
                // Reuse HeadPlugin's inert clone, or the inserted body script.
                // Scripts outside replaced fragments are staged only if new.
                const copy =
                    (item.original.isConnected && item.original.ownerDocument === document
                        ? item.original
                        : undefined) ??
                    [...document.querySelectorAll<HTMLScriptElement>("script")].find(
                        (script) =>
                            !executedNodes.has(script) &&
                            describeScript(script, document.baseURI)?.key === item.key,
                    );
                if (copy) copy.replaceWith(inert);
                else (item.head ? document.head : document.body).append(inert);
                const script = runScript(inert);
                script.async = false;
                executedNodes.add(script);
                let observed = script;
                if (!item.src && item.type === "module") {
                    observed = document.createElement("script");
                    observed.type = "module";
                    observed.async = false;
                    observed.src = "data:application/javascript,";
                    observed.setAttribute("data-swup-ignore-script", "");
                    if (script.nonce) observed.nonce = script.nonce;
                    document.body.append(observed);
                }
                const ready =
                    item.src || item.type === "module"
                        ? new Promise<void>((resolve) => {
                              const finish = (failed = false) => {
                                  clearTimeout(timer);
                                  observed.removeEventListener("load", loaded);
                                  observed.removeEventListener("error", failedHandler);
                                  if (observed !== script) observed.remove();
                                  if (failed) {
                                      executions.delete(item.key);
                                      script.remove();
                                      logger.warn(
                                          `page script failed to load: ${item.src ?? "inline module"}`,
                                      );
                                  }
                                  resolve();
                              };
                              const loaded = () => finish();
                              const failedHandler = () => finish(true);
                              const timer = setTimeout(failedHandler, options.timeoutMs ?? 15_000);
                              observed.addEventListener("load", loaded, { once: true });
                              observed.addEventListener("error", failedHandler, { once: true });
                          })
                        : Promise.resolve();
                executions.set(item.key, ready);
                await abortable(ready, signal);
            }
        })();
        return execution;
    };
}
