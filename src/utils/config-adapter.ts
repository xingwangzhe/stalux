// 导入默认配置
import {type SiteConfig} from '../types'
import { site as defaultConfig } from '../consts';
// 不要使用静态导入，改用动态导入
async function getConfig(): Promise<SiteConfig> {
  let userConfig;
  
  try {
    // 使用动态导入代替require
    userConfig = await import('../_config').catch(() => null);
    
    // 检查是否存在配置且开关已打开
    if (userConfig && userConfig.useConfig === true) {
      return userConfig.siteConfig;
    }
  } catch (error) {
    // 如果导入失败，表示 _config.ts 文件不存在或内容有误
    // 这里我们不打印错误信息，因为这是预期的行为（用户可能没有创建配置文件）
  }
  
  // 默认使用 consts.ts 中的配置
  return defaultConfig;
}
// 导出配置 - 使用异步函数的结果初始化
// 我们需要立即初始化一个默认值，但会在应用启动时尽快获取真实配置
export let config_site: SiteConfig = defaultConfig;

// 立即执行的异步函数来更新配置
(async () => {
  try {
    config_site = await getConfig();
  } catch (error) {
    // 配置加载失败时仍使用默认配置
  }
})();
