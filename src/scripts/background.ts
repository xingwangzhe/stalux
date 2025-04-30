/**
 * 随机背景图片实现
 * 每次加载页面时随机选择一张背景图片进行平铺
 * 样式已移至 global.styl 实现解耦
 */
// 背景图片总数
const TOTAL_PATTERNS = 42;

// 随机选择一个背景图案
function selectRandomBackground(): void {
  // 生成1到TOTAL_PATTERNS的随机整数
  const randomNum = Math.floor(Math.random() * TOTAL_PATTERNS) + 1;
  
  // 直接设置 body 元素的背景图片
  document.body.style.backgroundImage = `url('/images/background/pattern-${randomNum}.min.svg')`;
  
  // 添加类名以应用 global.styl 中定义的样式
  document.body.classList.add('has-bg-pattern', 'fade-in-background');
  
  // 可选: 添加数据属性，便于其他地方可能的样式定制
  document.body.setAttribute('data-bg-pattern', randomNum.toString());
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', selectRandomBackground);

// 导出函数，以便可以在其他地方手动调用
export { selectRandomBackground };