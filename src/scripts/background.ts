/**
 * 双层随机背景 — 纯客户端实现
 *
 * SVG 以静态 URL（/background/pattern-N.min.svg）硬编码，由集成在
 * config:setup 时复制到用户项目 public/background/。不经过 Astro 资源
 * 管线（import.meta.glob 会给 SVG 打上每次构建随机的 __ASTRO_ASSET_IMAGE__
 * 占位符，破坏增量构建依赖图 hash），也不做任何构建期扫描。
 *
 * 背景随机在客户端运行时执行，构建产物完全确定。
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

function initBackground(): void {
    // 客户端运行时随机选图，构建产物保持确定性
    const index = Math.floor(Math.random() * backgroundImages.length);
    const layer: "a" | "b" = "a";
    if (backgroundImages.length > 0) {
        const el = getLayerEl(layer);
        if (el) el.style.backgroundImage = `url('${backgroundImages[index]}')`;
    }
    setLayerOpacity(layer, 1);
    setLayerOpacity("b", 0);
    document.body.dataset.staluxBgIndex = String(index);
    document.body.dataset.staluxBgLayer = layer;
}

// 初始化（首次加载 + VT 软导航都走这里）
document.addEventListener("astro:page-load", () => {
    const layer = document.body.dataset.staluxBgLayer as "a" | "b" | undefined;
    const indexStr = document.body.dataset.staluxBgIndex;

    if (layer && indexStr !== undefined) {
        // View Transition 后：新页面服务端已渲染正确的背景，直接同步状态
        setLayerOpacity(layer, 1);
        setLayerOpacity(layer === "a" ? "b" : "a", 0);
    } else {
        initBackground();
    }
});
