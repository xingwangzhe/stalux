import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

const imgboxs = document.querySelectorAll(".article-content img");
imgboxs.forEach((img) => {
  const parent = img.parentElement;
  if (!parent) return;
  if (parent.tagName.toLowerCase() !== "a") {
    const a = document.createElement("a");
    a.href = img.getAttribute("data-src") || img.getAttribute("src") || "";
    parent.insertBefore(a, img);
    a.appendChild(img);
  }
});

const lightbox = new PhotoSwipeLightbox({
  gallery: ".article-content",
  children: "a",
  pswpModule: () => import("photoswipe"),
});

lightbox.init();
(window as any).__pswp_lightbox = lightbox;
