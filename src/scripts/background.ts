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
 *   此时设置背景，过渡动画中旧图淡出、新图淡入，自然 crossfade 无跳变。
 */
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
    return document.querySelector(`.bg-layer.bg-${layer}`);
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

function crossfadeBackground(): void {
    if (backgroundImages.length === 0) return;

    const activeLayer = getActiveLayer();
    const nextLayer: "a" | "b" = activeLayer === "a" ? "b" : "a";
    const previousIndex = Number(document.body.dataset.staluxBgIndex ?? -1);
    const index = pickBackgroundIndex(previousIndex);
    const next = getLayerEl(nextLayer);
    if (!next || !backgroundImages[index]) return;

    next.style.backgroundImage = `url('${backgroundImages[index]}')`;
    setLayerOpacity(nextLayer, 1);
    setLayerOpacity(activeLayer, 0);
    document.body.dataset.staluxBgIndex = String(index);
    document.body.dataset.staluxBgLayer = nextLayer;
}

function initializeBackground(): void {
    const active = getLayerEl(getActiveLayer());
    if (active?.style.backgroundImage) return;
    crossfadeBackground();
}

// before-swap 在 View Transition 的快照之后、DOM 替换之前触发；背景层使用
// transition:persist 保留，因此可以在页面内容交换期间完成双层 crossfade。
// 非 VT 浏览器也会触发该生命周期，fallback 同样保持平滑。
if (!(window as Window & { __STALUX_BG_LISTENER__?: boolean }).__STALUX_BG_LISTENER__) {
    (window as Window & { __STALUX_BG_LISTENER__?: boolean }).__STALUX_BG_LISTENER__ = true;
    document.addEventListener("astro:before-swap", crossfadeBackground);
    document.addEventListener("astro:page-load", initializeBackground);
}
