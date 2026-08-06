/**
 * 双层随机背景 — 客户端运行时随机选图，不做 VT crossfade
 * （去掉 view-transition-name 避免 SVG 全屏瓦片在过渡期间双倍 CPU 光栅化）
 * 背景随机从服务端移到客户端，保证构建产物确定性，
 * 使 Astro 增量构建的依赖图 hash 可跨构建复用。
 */
declare global {
    interface Window {
        __STALUX_BG_URLS__?: string[];
    }
}

const backgroundImages: string[] = window.__STALUX_BG_URLS__ || [];

function getLayerEl(layer: "a" | "b"): HTMLElement | null {
    return document.querySelector(`.bg-layer.bg-${layer}`);
}

function setLayerOpacity(layer: "a" | "b", opacity: number): void {
    const el = getLayerEl(layer);
    if (el) el.style.opacity = String(opacity);
}

function initBackground(): void {
    // 背景随机在客户端运行时执行，保证构建产物确定性
    // （SSR 固定索引 → 内联脚本稳定 → Astro 增量构建依赖图可复用）
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
