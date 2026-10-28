import { createClientLogger } from "./logger";

export type PageDisposer = () => void;
export type PageMount = () => PageDisposer | undefined;

interface RuntimeTarget extends EventTarget {
    readyState?: string;
}

interface RuntimeRegistration {
    disposePage?: PageDisposer;
    unregister: PageDisposer;
}

declare global {
    interface Window {
        __staluxPageRuntime?: Map<string, RuntimeRegistration>;
    }
}

export interface PageRuntimeEnvironment {
    host: Pick<Window, "__staluxPageRuntime">;
    target: RuntimeTarget;
    queueTask: (callback: () => void) => void;
}

function getBrowserEnvironment(): PageRuntimeEnvironment | undefined {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;
    return {
        host: window,
        target: document,
        queueTask: queueMicrotask,
    };
}

/** 文档是否已解析完、DOM 可查询（`loading` 之外的两种状态都算）。 */
function isDocumentParsed(readyState: string | undefined): boolean {
    return readyState === "interactive" || readyState === "complete";
}

/**
 * Mount one page-scoped behavior for the current DOM and dispose it before Astro swaps the body.
 * The key is global for the browser session, so a bundled module can be encountered repeatedly
 * without accumulating document-level listeners.
 *
 * 首访不能只等 `astro:page-load`：Astro 在首次加载时从 `window.load` 派发该事件，而
 * `window.load` 要等完所有图片、字体与第三方 iframe。首访一旦有子资源变慢或卡死
 * （国内访问外部资源时的常态），事件就迟迟不来甚至永不到达，评论与统计整页空白，
 * 此时 `document.readyState` 停在 `interactive`，只判 `complete` 的兜底也救不回来。
 * 因此文档解析完成即接管本页；`astro:page-load` 只负责软导航后的新页面与重复信号。
 */
export function registerPageLifecycle(
    key: string,
    mount: PageMount,
    environment = getBrowserEnvironment(),
): PageDisposer {
    if (!environment) return () => undefined;
    const logger = createClientLogger(key);

    const { host, target, queueTask } = environment;
    const registry = host.__staluxPageRuntime ?? new Map<string, RuntimeRegistration>();
    host.__staluxPageRuntime = registry;
    const existing = registry.get(key);
    if (existing) {
        logger.debug("registration reused");
        return existing.unregister;
    }
    logger.debug("lifecycle registered");

    let active = true;
    // 已安排但尚未执行的早挂载。自增即作废：早挂载一旦被 page-load 或换页接管，
    // 排队中的任务不能再挂到已被替换的 DOM 上。
    let pendingEarlyMount = 0;
    let earlyMountPending = false;
    // 早挂载已经覆盖当前页。此时 window.load 上的 page-load 只是同一页的重复信号，
    // 再挂一次会造出第二份观察器或第二个评论实例。
    let mountedEarly = false;
    const registration: RuntimeRegistration = {
        unregister: () => undefined,
    };

    const disposePage = () => {
        try {
            if (registration.disposePage) logger.debug("disposing page");
            registration.disposePage?.();
        } catch (error) {
            logger.error("page disposal failed", error);
            throw error;
        } finally {
            registration.disposePage = undefined;
        }
    };
    const mountPage = () => {
        if (!active) return;
        disposePage();
        const started = performance.now();
        logger.debug("mount started");
        try {
            registration.disposePage = mount() || undefined;
            logger.debug(
                `mount completed in ${(performance.now() - started).toFixed(1)}ms; cleanup=${Boolean(registration.disposePage)}`,
            );
        } catch (error) {
            logger.error("page mount failed", error);
            throw error;
        }
    };
    const handlePageLoad = () => {
        if (earlyMountPending) {
            // page-load 属于当前页，由它立即挂载，作废排队中的早挂载。
            pendingEarlyMount++;
            earlyMountPending = false;
            mountedEarly = true;
            mountPage();
            return;
        }
        if (mountedEarly) {
            mountedEarly = false;
            logger.debug("page-load after early mount; keeping the live instance");
            return;
        }
        mountPage();
    };
    const handleBeforeSwap = () => {
        pendingEarlyMount++;
        earlyMountPending = false;
        mountedEarly = false;
        disposePage();
    };
    const mountEarlyPage = () => {
        const token = ++pendingEarlyMount;
        earlyMountPending = true;
        // 微任务：模块脚本执行时 DOM 已完整，但要等模块自身求值结束再调用 mount()
        // （模块顶层的后置绑定可能仍在 TDZ）。
        queueTask(() => {
            if (!active || token !== pendingEarlyMount || !earlyMountPending) return;
            earlyMountPending = false;
            mountedEarly = true;
            mountPage();
        });
    };
    const handleDomReady = () => mountEarlyPage();

    target.addEventListener("astro:page-load", handlePageLoad);
    target.addEventListener("astro:before-swap", handleBeforeSwap);

    registration.unregister = () => {
        if (!active) return;
        active = false;
        try {
            disposePage();
        } finally {
            target.removeEventListener("astro:page-load", handlePageLoad);
            target.removeEventListener("astro:before-swap", handleBeforeSwap);
            target.removeEventListener("DOMContentLoaded", handleDomReady);
            registry.delete(key);
        }
    };
    registry.set(key, registration);

    if (isDocumentParsed(target.readyState)) mountEarlyPage();
    else target.addEventListener("DOMContentLoaded", handleDomReady, { once: true });

    return registration.unregister;
}
