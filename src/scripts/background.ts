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

function applyBackground(): void {
    // 客户端运行时随机选图，构建产物保持确定性
    const index = Math.floor(Math.random() * backgroundImages.length);
    const layer: "a" | "b" = "a";
    if (backgroundImages.length > 0 && backgroundImages[index]) {
        const el = getLayerEl(layer);
        if (el) el.style.backgroundImage = `url('${backgroundImages[index]}')`;
    }
    setLayerOpacity(layer, 1);
    setLayerOpacity("b", 0);
    document.body.dataset.staluxBgIndex = String(index);
    document.body.dataset.staluxBgLayer = layer;
}

// 首次加载与 VT 软导航都触发 astro:page-load：
// - 首次加载：window load 后触发（router.js addEventListener("load", onPageLoad)）。
// - VT 软导航：swap 完成后、过渡动画期间触发（router.js onPageLoad()），
//   此时设置随机背景，过渡中旧图淡出、新图淡入，无跳变闪变。
// 注意：软导航不会重新执行打包的 module 脚本（监听器仍是首访注册的），
// 所以这里不能做“只执行一次”的去重，每次 page-load 都必须随机；
// 若软导航后新脚本被重新执行，重复监听导致随机两次也无妨（仍是随机图）。
// body 的 data-stalux-bg-* 是 SSR 固定占位（a/0，为了构建确定性），
// 不能再用它判断“服务端已渲染正确背景”，否则随机逻辑永不执行。
document.addEventListener("astro:page-load", applyBackground);
