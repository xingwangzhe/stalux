/**
 * 双层随机背景 — 纯客户端实现
 *
 * SVG 以静态 URL（/background/pattern-N.min.svg）硬编码，由集成在
 * config:setup 时复制到用户项目 public/background/。不经过 Astro 资源
 * 管线（import.meta.glob 会给 SVG 打上每次构建随机的 __ASTRO_ASSET_IMAGE__
 * 占位符，破坏增量构建依赖图 hash），也不做任何构建期扫描。
 *
 * 背景行为：
 * - SSR 只渲染灰墙底色（--stalux-bg-color），不渲染任何背景图，构建产物确定。
 * - 首次加载与 VT 软导航每次都会随机选一张背景：astro:page-load 在
 *   window load（首访）与 swap 完成后、过渡动画期间（软导航）触发，
 *   先低优先级解码目标背景，等待内容过渡完成后再淡入，不与内容快照争抢绘制。
 */
import { createClientLogger } from "./logger";
import { prepareRouteMotion, type RouteMotionEvent } from "./route-motion";

const logger = createClientLogger("background");

declare global {
    interface Window {
        __STALUX_BG_URLS__?: string[];
    }
}

/** 背景 SVG 静态 URL 列表（与主题包 public/background/ 的 1-42 号一一对应） */
const BACKGROUND_URLS: string[] = Array.from(
    { length: 42 },
    (_, i) => `/background/pattern-${i + 1}.min.svg`,
);

/** 优先使用注入列表（若用户自定义），否则用内置硬编码列表 */
const backgroundImages: string[] = window.__STALUX_BG_URLS__?.length
    ? window.__STALUX_BG_URLS__
    : BACKGROUND_URLS;

function getLayerEl(layer: "a" | "b"): HTMLElement | null {
    return document.querySelector(`[data-stalux-background="${layer}"]`);
}

function setLayerOpacity(layer: "a" | "b", opacity: number): void {
    const el = getLayerEl(layer);
    if (el) el.style.opacity = String(opacity);
}

function getActiveLayer(): "a" | "b" {
    const aOpacity = Number(getLayerEl("a")?.style.opacity ?? 0);
    const bOpacity = Number(getLayerEl("b")?.style.opacity ?? 0);
    return bOpacity > aOpacity ? "b" : "a";
}

function pickBackgroundIndex(previous: number): number {
    if (backgroundImages.length < 2) return 0;
    let index = Math.floor(Math.random() * backgroundImages.length);
    while (index === previous) {
        index = Math.floor(Math.random() * backgroundImages.length);
    }
    return index;
}

function crossfadeBackground(index: number): void {
    const activeLayer = getActiveLayer();
    const nextLayer: "a" | "b" = activeLayer === "a" ? "b" : "a";
    const next = getLayerEl(nextLayer);
    if (!next || !backgroundImages[index]) {
        logger.debug("background layer unavailable; skipped");
        return;
    }
    logger.debug(`crossfade layer=${nextLayer}; index=${index}`);

    next.style.backgroundImage = `url('${backgroundImages[index]}')`;
    setLayerOpacity(nextLayer, 1);
    setLayerOpacity(activeLayer, 0);
    document.body.dataset.staluxBgIndex = String(index);
    document.body.dataset.staluxBgLayer = nextLayer;
}

let generation = 0;
let prepared: Promise<number | undefined> | undefined;
let transitionFinished: Promise<unknown> = Promise.resolve();

function prepareBackground(): Promise<number | undefined> {
    const previousIndex = Number(document.body.dataset.staluxBgIndex ?? -1);
    const index = pickBackgroundIndex(previousIndex);
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = "low";
    image.src = backgroundImages[index] ?? "";
    return image.decode().then(
        () => index,
        () => undefined,
    );
}

let firstCommitStarted = false;

function initializeBackground(): void {
    const active = getLayerEl(getActiveLayer());
    if (!prepared && active?.style.backgroundImage) return;
    // 首访的早提交已经发起，但解码还没落地：此时 window.load 上的 page-load
    // 不是新页面，不能再解码并淡入第二张。
    if (!prepared && firstCommitStarted) return;
    if (!prepared) firstCommitStarted = true;
    const current = generation;
    const ready = prepared ?? prepareBackground();
    prepared = undefined;
    // Decode off the navigation path, and keep the full-screen background repaint
    // out of the content's View Transition. A superseded navigation never commits.
    void Promise.all([ready, transitionFinished]).then(([index]) => {
        if (current === generation && index !== undefined) crossfadeBackground(index);
    });
}

// 背景层跨页保留；before-swap 只记录过渡完成信号，不阻塞或修改内容快照。
// page-load 再提交已解码的背景，非 VT 浏览器也采用同一清理/去重流程。
if (!(window as Window & { __STALUX_BG_LISTENER__?: boolean }).__STALUX_BG_LISTENER__) {
    (window as Window & { __STALUX_BG_LISTENER__?: boolean }).__STALUX_BG_LISTENER__ = true;
    document.addEventListener("astro:before-preparation", () => {
        generation++;
        const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
            .connection;
        prepared = connection?.saveData ? undefined : prepareBackground();
    });
    document.addEventListener("astro:before-swap", (event) => {
        transitionFinished = prepareRouteMotion(event as RouteMotionEvent).finished;
    });
    document.addEventListener("astro:page-load", initializeBackground);
    // 首访的 page-load 由 window.load 派发，任何慢图片或卡死的第三方资源都会把首屏背景
    // 拖成一片纯色；文档解析完就提交首张背景，软导航仍由 page-load 负责。
    const readyState = document.readyState;
    if (readyState === "interactive" || readyState === "complete") initializeBackground();
    else document.addEventListener("DOMContentLoaded", initializeBackground, { once: true });
}
