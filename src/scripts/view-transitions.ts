// 简化的视图过渡增强脚本

// 创建加载指示器
function createLoadingIndicator(): HTMLElement {
  const indicator = document.createElement("div");
  indicator.className = "loading-indicator";
  indicator.id = "page-loading-indicator";
  document.body.appendChild(indicator);
  return indicator;
}

// 显示加载指示器
function showLoadingIndicator(): void {
  const indicator =
    document.getElementById("page-loading-indicator") ||
    createLoadingIndicator();
  indicator.classList.add("show");
}

// 隐藏加载指示器
function hideLoadingIndicator(): void {
  const indicator = document.getElementById("page-loading-indicator");
  if (indicator) {
    indicator.classList.remove("show");
  }
}

// 设置页面过渡动画
function setupPageTransitions(): void {
  // 页面加载前显示指示器
  document.addEventListener("astro:before-preparation", showLoadingIndicator);

  // 页面加载完成后隐藏指示器
  document.addEventListener("astro:after-preparation", hideLoadingIndicator);

  // 页面交换前保持主题
  document.addEventListener("astro:before-swap", (event: any) => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") ||
      (localStorage.theme === "dark" ? "dark" : "light");

    if (event.newDocument) {
      event.newDocument.documentElement.setAttribute(
        "data-theme",
        currentTheme
      );
    }
  });

  // 页面导航完成后重新初始化
  document.addEventListener("astro:page-load", () => {
    // 重新初始化代码高亮等
    const prism = (window as any).Prism;
    if (prism && typeof prism.highlightAll === "function") {
      prism.highlightAll();
    }

    // 重新初始化图片画廊（GLightbox）
    const gl = (window as any).__glightbox;
    if (gl) {
      try {
        if (typeof gl.destroy === "function") gl.destroy();
      } catch (e) {
        // ignore
      }
    }
    // 重新创建实例（使用动态导入以避免打包问题）
    try {
      const init = (window as any).__initGlightbox;
      if (typeof init === "function") {
        init();
      } else {
        import("glightbox").then((mod) => {
          const GLightbox = (mod && (mod as any).default) || mod;
          GLightbox({ selector: "a.glightbox-item, a.glightbox" });
        });
      }
    } catch (e) {
      // ignore
    }
  });
}

// 初始化
document.addEventListener("DOMContentLoaded", setupPageTransitions);

// 导出给其他脚本使用
(window as any).viewTransitionUtils = {
  showLoadingIndicator,
  hideLoadingIndicator,
};
