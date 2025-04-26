/**
 * 随机背景图片实现
 * 每次加载页面时随机选择一张背景图片进行平铺
 */

// 背景图片总数
const TOTAL_PATTERNS = 42;

// 随机选择一个背景图案
function selectRandomBackground(): void {
  // 生成1到TOTAL_PATTERNS的随机整数
  const randomNum = Math.floor(Math.random() * TOTAL_PATTERNS) + 1;
  
  // 创建一个伪元素作为背景层
  const bgElement = document.createElement('div');
  bgElement.style.position = 'fixed';
  bgElement.style.top = '0';
  bgElement.style.left = '0';
  bgElement.style.width = '100%';
  bgElement.style.height = '100%';
  bgElement.style.zIndex = '-1';
  bgElement.style.opacity = '0.5';
  bgElement.style.backgroundImage = `url('/images/background/pattern-${randomNum}.min.svg')`;
  bgElement.style.backgroundRepeat = 'repeat';
  bgElement.style.backgroundSize = 'auto';
  bgElement.style.backgroundPosition = 'center';
  bgElement.style.pointerEvents = 'none';  
  bgElement.className = 'fade-in-background';
  document.body.appendChild(bgElement);
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', selectRandomBackground);

// 导出函数，以便可以在其他地方手动调用
export { selectRandomBackground };