import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.min.css";

function ensureGlightboxAnchors() {
  const imgboxs = document.querySelectorAll(".article-content img");
  imgboxs.forEach((img) => {
    const parent = img.parentElement;
    if (!parent) return;
    if (parent.tagName.toLowerCase() !== "a") {
      const a = document.createElement("a");
      a.href = img.getAttribute("data-src") || img.getAttribute("src") || "";
      a.classList.add("glightbox-item");
      parent.insertBefore(a, img);
      a.appendChild(img);
    } else {
      const a = parent as HTMLAnchorElement;
      if (a.querySelector("img")) {
        a.classList.add("glightbox-item");
      }
    }
  });
}

function initGlightbox() {
  ensureGlightboxAnchors();
  try {
    const instance = GLightbox({ selector: "a.glightbox-item, a.glightbox" });
    (window as any).__glightbox = instance;
  } catch (e) {
    // ignore initialization errors
  }
}

// 初始化并暴露到全局，兼容页面热加载
initGlightbox();
(window as any).__initGlightbox = initGlightbox;
