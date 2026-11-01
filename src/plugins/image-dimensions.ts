import { defineHastPlugin } from "satteri";

/**
 * Markdown 图片标题里的 `宽x高` 是外部图片的尺寸声明，不是给读者看的提示。
 *
 * 外部图片无法在构建期读取像素尺寸，浏览器只能等下载完才知道比例，正文会被
 * 推开（CLS）。写成 `![alt](https://… "532x200")` 后，这里在 HAST 阶段补上
 * width/height，PhotoSwipe 也能拿到 data-pswp-width/height；标题本身随即移除。
 */
const DIMENSION_TITLE = /^(\d{1,6})\s*[x×]\s*(\d{1,6})$/u;

export const imageDimensions = defineHastPlugin({
    name: "stalux-image-dimensions",
    element: {
        filter: ["img"],
        visit(node, ctx) {
            const title = node.properties?.title;
            if (typeof title !== "string") return;
            const match = DIMENSION_TITLE.exec(title.trim());
            if (!match) return;
            const width = Number(match[1]);
            const height = Number(match[2]);
            if (!(width > 0 && height > 0)) return;
            if (node.properties?.width === undefined) {
                ctx.setProperty(node, "width", String(width));
            }
            if (node.properties?.height === undefined) {
                ctx.setProperty(node, "height", String(height));
            }
            // 尺寸声明已转成属性，不再让浏览器把它当成悬浮提示。
            ctx.setProperty(node, "title", undefined);
        },
    },
});
