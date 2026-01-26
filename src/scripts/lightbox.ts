// PhotoSwipe Lightbox 初始化工具（仅在客户端使用）
import PhotoSwipeLightbox from 'photoswipe/lightbox';

export type LightboxOptions = {
    gallery?: string;
    children?: string;
};

export function initLightbox(options: LightboxOptions = {}) {
    const { gallery = '[data-pagefind-body]', children = 'a[data-pswp]' } = options;

    const el = typeof document !== 'undefined' ? document.querySelector(gallery) : null;
    if (!el) return null;

    const lightbox = new PhotoSwipeLightbox({
        gallery,
        children,
        pswpModule: () => import('photoswipe'),
    });
    lightbox.init();
    return lightbox;
}
