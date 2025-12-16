import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

const imgboxs = document.querySelectorAll(".article-content img");
imgboxs.forEach((img) => {
  const parent = img.parentElement;
  if (!parent) return;
  // 如果父元素不是 <a>，则创建一个只包裹图片的 <a> 并加上特定类
  if (parent.tagName.toLowerCase() !== "a") {
    const a = document.createElement("a");
    a.href = img.getAttribute("data-src") || img.getAttribute("src") || "";
    a.classList.add("pswp-gallery-item");
    parent.insertBefore(a, img);
    a.appendChild(img);
  } else {
    // 已经是 <a> 的情况，只在该 <a> 包裹的是图片时添加标记类，避免影响普通链接
    const a = parent as HTMLAnchorElement;
    // 确保该链接直接包裹图片节点
    if (a.querySelector("img")) {
      a.classList.add("pswp-gallery-item");
    }
  }
});

const lightbox = new PhotoSwipeLightbox({
  gallery: ".article-content",
  // 仅选择带有 pswp-gallery-item 类的链接，避免影响其他普通链接
  children: "a.pswp-gallery-item",
  pswpModule: () => import("photoswipe"),
});

lightbox.init();
(window as any).__pswp_lightbox = lightbox;
