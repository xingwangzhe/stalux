/**
 * 简化的随机背景图片实现 - 支持视图过渡
 * 每次页面导航时随机选择一张背景图片
 */

// 背景图片数组
const backgroundImages = Array.from({ length: 42 }, (_, i) => {
  const index = i + 1;
  return new URL(`../images/background/pattern-${index}.min.svg`, import.meta.url).href;
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

// 应用背景
function applyBackground(imageUrl: string): void {
  // 移除旧背景
  const oldContainer = document.getElementById('background-container');
  if (oldContainer) {
    oldContainer.remove();
  }
  
  // 创建新背景
  const bgContainer = document.createElement('div');
  bgContainer.id = 'background-container';
  bgContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -10;
    background-image: url('${imageUrl}');
    background-repeat: repeat;
    background-size: auto;
    background-position: center;
    view-transition-name: background-pattern;
  `;
  
  // 添加到页面
  document.body.insertBefore(bgContainer, document.body.firstChild);
}

// 初始化
document.addEventListener('DOMContentLoaded', selectRandomBackground);

// 视图过渡时随机更换背景
document.addEventListener('astro:page-load', selectRandomBackground);

export { selectRandomBackground };