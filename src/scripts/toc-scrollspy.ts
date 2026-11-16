import { initTocScrollSpy } from "../utils/toc-scrollspy";
import { registerPageLifecycle } from "./page-runtime";

/**
 * 目录高亮初始化会读取全部标题位置，强制一次完整布局：线上文章页实测
 * 226ms 长任务（JS 仅 21ms，其余是 Style & Layout），正好落在 TBT 统计窗口内。
 * 而读者进入文章后通常先看开头，滚到需要高亮的时机远晚于首屏，
 * 因此把它放到空闲时段；2s 兜底保证页面持续繁忙时仍会初始化。
 */
registerPageLifecycle("toc-scrollspy", () => {
    const container = document.querySelector<HTMLElement>("[data-toc-active-class]");
    const activeClass = container?.dataset.tocActiveClass;
    if (!activeClass) return;
    let cleanup: (() => void) | undefined;
    let disposed = false;
    const run = () => {
        if (!disposed) cleanup = initTocScrollSpy(activeClass);
    };
    const cancelScheduled = (() => {
        if (typeof window.requestIdleCallback === "function") {
            const handle = window.requestIdleCallback(run, { timeout: 2000 });
            return () => window.cancelIdleCallback(handle);
        }
        const handle = window.setTimeout(run, 300);
        return () => window.clearTimeout(handle);
    })();
    return () => {
        disposed = true;
        cancelScheduled();
        cleanup?.();
    };
});
