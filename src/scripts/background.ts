/**
 * 与 Astro View Transitions 生命周期同步的随机背景
 * 利用 view-transition-name 让浏览器原生处理背景 crossfade
 */
declare global {
    interface Window {
        __STALUX_BG_URLS__?: string[];
        __STALUX_BG_INDEX__?: number;
    }
}

const backgroundImages: string[] = window.__STALUX_BG_URLS__ || [];
const initialIndexFromSSR =
    typeof window.__STALUX_BG_INDEX__ === "number" ? window.__STALUX_BG_INDEX__ : -1;

function getRandomIndex(exclude: number): number {
    if (backgroundImages.length <= 1) return 0;
    let idx;
    do {
        idx = Math.floor(Math.random() * backgroundImages.length);
    } while (idx === exclude);
    return idx;
}

function getLayerEl(layer: "a" | "b"): HTMLElement | null {
    return document.querySelector(`.bg-layer.bg-${layer}`);
}

function setLayerImage(layer: "a" | "b", url: string): void {
    const el = getLayerEl(layer);
    if (el) el.style.backgroundImage = `url('${url}')`;
}

function setLayerOpacity(layer: "a" | "b", opacity: number): void {
    const el = getLayerEl(layer);
    if (el) el.style.opacity = String(opacity);
}

function clearVtActive(): void {
    document.querySelectorAll(".bg-layer.vt-active").forEach((el) => {
        el.classList.remove("vt-active");
    });
}

function initBackground(): void {
    if (initialIndexFromSSR >= 0 && backgroundImages.length > 0) {
        // 服务端已经预填充了 .bg-a，只需要确保状态一致
        document.body.dataset.staluxBgIndex = String(initialIndexFromSSR);
        document.body.dataset.staluxBgLayer = "a";
        setLayerOpacity("a", 1);
        setLayerOpacity("b", 0);
    } else {
        // Fallback：客户端自行随机初始化
        const index = getRandomIndex(-1);
        const randomLayer: "a" | "b" = Math.random() > 0.5 ? "a" : "b";
        if (backgroundImages.length > 0) {
            setLayerImage(randomLayer, backgroundImages[index]);
        }
        setLayerOpacity(randomLayer, 1);
        setLayerOpacity(randomLayer === "a" ? "b" : "a", 0);
        document.body.dataset.staluxBgIndex = String(index);
        document.body.dataset.staluxBgLayer = randomLayer;
    }
}

// View Transition 前：准备下一张背景并标记新旧活跃层
// @ts-ignore - Astro custom event
document.addEventListener("astro:before-swap", (event: any) => {
    const newDoc = event.newDocument as Document;
    const currentLayer =
        (document.body.dataset.staluxBgLayer as "a" | "b") || "a";
    const nextLayer = currentLayer === "a" ? "b" : "a";

    const currentIndex = parseInt(
        document.body.dataset.staluxBgIndex || "-1",
        10,
    );
    const nextIndex =
        backgroundImages.length > 0 ? getRandomIndex(currentIndex) : -1;

    // 旧页面：标记当前层，让浏览器捕获它的快照
    getLayerEl(currentLayer)?.classList.add("vt-active");

    // 新页面：预先设置隐藏层为背景目标层，并赋予相同 view-transition-name
    const nextEl = newDoc.querySelector(
        `.bg-layer.bg-${nextLayer}`,
    ) as HTMLElement | null;
    const otherEl = newDoc.querySelector(
        `.bg-layer.bg-${currentLayer}`,
    ) as HTMLElement | null;
    if (nextEl) {
        if (nextIndex >= 0) {
            nextEl.style.backgroundImage = `url('${backgroundImages[nextIndex]}')`;
        }
        nextEl.classList.add("vt-active");
        nextEl.style.opacity = "1";
    }
    if (otherEl) {
        otherEl.style.opacity = "0";
    }

    // 通过 data 属性把状态传递给新页面
    newDoc.body.dataset.staluxBgLayer = nextLayer;
    newDoc.body.dataset.staluxBgIndex = String(nextIndex);
});

// View Transition 交换完成后：清理标记
document.addEventListener("astro:after-swap", () => {
    clearVtActive();
});

// 页面加载完成时：恢复背景层状态
document.addEventListener("astro:page-load", () => {
    const layer = document.body.dataset.staluxBgLayer as "a" | "b" | undefined;
    const indexStr = document.body.dataset.staluxBgIndex;

    if (layer && indexStr !== undefined) {
        // 经历了 View Transition：切换到新层
        setLayerOpacity(layer, 1);
        setLayerOpacity(layer === "a" ? "b" : "a", 0);
    } else {
        // 首次加载或 fallback
        initBackground();
    }
});
