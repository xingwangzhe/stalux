/**
 * 每个完整文档只随机选择一次的会话背景。
 *
 * SSR 保持确定的深色底和原有双层 DOM，不内联背景 URL。文档解析完成即
 * 低优先级请求并异步解码一张深色底 WebP，无需等待 window.load。首次成功时从暗底
 * 用 200ms opacity 淡显；减少动态效果时直接显示。解码慢或失败仍保持暗底。
 * Swup 只替换 main，背景沿用同一张，不按软导航重选/解码或再次交叉淡入。
 * 自定义 __STALUX_BG_URLS__ 继续生效；saveData 下保留暗底，不请求装饰图片。
 */
import { createClientLogger } from "./logger";

const logger = createClientLogger("background");

declare global {
    interface Window {
        __STALUX_BG_URLS__?: string[];
        __STALUX_BG_LISTENER__?: boolean;
    }
}

const BACKGROUND_URLS: string[] = Array.from(
    { length: 42 },
    (_, i) => `/background/pattern-${i + 1}.min.dark.webp`,
);

/** Install once per full document; this module is also harmless during SSR. */
export function installSessionBackground(): void {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (window.__STALUX_BG_LISTENER__) return;
    window.__STALUX_BG_LISTENER__ = true;
    const start = () => {
        const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
            .connection;
        if (connection?.saveData) return;
        const a = document.querySelector<HTMLElement>('[data-stalux-background="a"]');
        const b = document.querySelector<HTMLElement>('[data-stalux-background="b"]');
        if (!(a && b) || a.style.backgroundImage || b.style.backgroundImage) return;
        const custom = Boolean(window.__STALUX_BG_URLS__?.length);
        const urls = window.__STALUX_BG_URLS__?.length
            ? window.__STALUX_BG_URLS__
            : BACKGROUND_URLS;
        const index = Math.floor(Math.random() * urls.length);
        // The compact raster is composited against the standard canvas. Preserve
        // CSS custom canvas colors with the original transparent raster.
        const standardCanvas =
            typeof getComputedStyle === "undefined" ||
            getComputedStyle(a).backgroundColor === "rgb(32, 32, 32)";
        const selected = urls[index];
        const source =
            custom || standardCanvas ? selected : selected?.replace(/\.dark\.webp$/u, ".webp");
        if (!source) return;
        const image = new Image();
        image.decoding = "async";
        image.fetchPriority = "low";
        image.src = source;
        void image.decode().then(
            () => {
                // These two shell nodes retain their identities during Swup visits.
                // No navigation event can start another image or reset this result.
                if (!(a.isConnected && b.isConnected)) return;
                // Original SVGs have only a viewBox: auto sizes them as contain.
                // Raster files have intrinsic dimensions, so retain that sizing
                // explicitly. Custom URLs keep the existing auto semantics.
                if (!custom) b.style.backgroundSize = "contain";
                b.style.backgroundImage = `url('${source}')`;
                b.style.opacity = "1";
                a.style.opacity = "0";
                document.body.dataset.staluxBgIndex = String(index);
                document.body.dataset.staluxBgLayer = "b";
            },
            () => {
                logger.debug("session background failed to decode; keeping dark canvas");
            },
        );
    };
    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
}

installSessionBackground();
