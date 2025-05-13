/**
 * 随机背景图片实现
 * 每次加载页面时随机选择一张背景图片进行平铺
 * 使用额外的DOM元素实现背景淡入效果，提高性能
 */
// 背景图片总数
// 预加载所有背景图片
const backgroundImages = Array.from({ length: 42 }, (_, i) => {
  const index = i + 1;
  return {
    id: index,
    url: new URL(`../images/background/pattern-${index}.min.svg`, import.meta.url).href
  };
});

// 使用backgroundImages的长度来确定总数量

// 随机选择一个背景图案
function selectRandomBackground(): void {
  // 生成1到backgroundImages.length的随机整数
  const randomIndex = Math.floor(Math.random() * backgroundImages.length);
  
  // 获取随机选择的背景图片URL
  const selectedBackground = backgroundImages[randomIndex];
  
  // 创建背景容器元素
  const bgContainer = document.createElement('div');
  bgContainer.id = 'background-container';
  bgContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -10;
    background-image: url('${selectedBackground.url}');
    background-repeat: repeat;
    background-size: auto;
    background-position: center;
    opacity: 0;
    transition: opacity 1.2s ease;
  `;
  
  // 添加到body的最前面
  if (document.body.firstChild) {
    document.body.insertBefore(bgContainer, document.body.firstChild);
  } else {
    document.body.appendChild(bgContainer);
  }
  
  // 延迟一点点再显示，确保DOM插入后再执行动画
  setTimeout(() => {
    bgContainer.style.opacity = '1';
  }, 100);
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', selectRandomBackground);

// 导出函数，以便可以在其他地方手动调用
export { selectRandomBackground };