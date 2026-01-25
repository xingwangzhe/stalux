/**
 * 简化的随机背景图片实现 - 支持视图过渡
 * 每次页面导航时随机选择一张背景图片
 */
// 背景图片数组
const backgroundImages = Array.from({ length: 42 }, (_, i) => {
  const index = i + 1;
  return new URL(`../assets/background/pattern-${index}.min.svg`, import.meta.url).href;
});

let currentBackgroundIndex = -1;

// 随机选择背景
function selectRandomBackground(): void {
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * backgroundImages.length);
  } while (randomIndex === currentBackgroundIndex && backgroundImages.length > 1);

  currentBackgroundIndex = randomIndex;
  applyBackground(backgroundImages[randomIndex]);
}

// 应用背景：通过设置 CSS 变量，由 CSS 伪元素渲染背景
function applyBackground(imageUrl: string): void {
  const root = document.documentElement;
  // 设置 CSS 变量
  root.style.setProperty("--stalux-bg-image", `url('${imageUrl}')`);
}

// 初始化
document.addEventListener("DOMContentLoaded", selectRandomBackground);

// 视图过渡时随机更换背景
document.addEventListener("astro:page-load", selectRandomBackground);

export { selectRandomBackground };
