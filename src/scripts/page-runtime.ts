export type PageDisposer = () => void;
export type PageMount = () => PageDisposer | undefined;

interface RuntimeTarget extends EventTarget {
    readyState?: string;
}

interface RuntimeRegistration {
    disposePage?: PageDisposer;
    unregister: PageDisposer;
}

interface RuntimeHost {
    __staluxPageRuntime?: Map<string, RuntimeRegistration>;
}

export interface PageRuntimeEnvironment {
    host: RuntimeHost;
    target: RuntimeTarget;
    queueTask: (callback: () => void) => void;
}

function getBrowserEnvironment(): PageRuntimeEnvironment | undefined {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;
    return {
        host: window as RuntimeHost,
        target: document,
        queueTask: queueMicrotask,
    };
}

/**
 * Mount one page-scoped behavior for the current DOM and dispose it before Astro swaps the body.
 * The key is global for the browser session, so a bundled module can be encountered repeatedly
 * without accumulating document-level listeners.
 */
export function registerPageLifecycle(
    key: string,
    mount: PageMount,
    environment = getBrowserEnvironment(),
): PageDisposer {
    if (!environment) return () => undefined;

    const { host, target, queueTask } = environment;
    const registry = host.__staluxPageRuntime ?? new Map<string, RuntimeRegistration>();
    host.__staluxPageRuntime = registry;
    const existing = registry.get(key);
    if (existing) return existing.unregister;

    let active = true;
    const registration: RuntimeRegistration = {
        unregister: () => undefined,
    };

    const disposePage = () => {
        registration.disposePage?.();
        registration.disposePage = undefined;
    };
    const mountPage = () => {
        if (!active) return;
        disposePage();
        registration.disposePage = mount() || undefined;
    };
    const handlePageLoad = () => mountPage();
    const handleBeforeSwap = () => disposePage();

    target.addEventListener("astro:page-load", handlePageLoad);
    target.addEventListener("astro:before-swap", handleBeforeSwap);

    registration.unregister = () => {
        if (!active) return;
        active = false;
        disposePage();
        target.removeEventListener("astro:page-load", handlePageLoad);
        target.removeEventListener("astro:before-swap", handleBeforeSwap);
        registry.delete(key);
    };
    registry.set(key, registration);

    // Late-loaded modules can miss Astro's initial page-load event.
    if (target.readyState === "complete") queueTask(mountPage);

    return registration.unregister;
}
