// 导入默认配置
import {type SiteConfig} from '../types'
import { site as defaultConfig } from '../consts';

// 直接尝试导入用户配置
function getConfig(): SiteConfig {
  try {
    // 动态导入用户配置（这在构建时会被 Astro/Vite 正确处理）
    // @ts-ignore - 动态导入会在构建时处理
    const userConfig = require('../_config');
    
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

// 导出配置
export const config_site: SiteConfig = getConfig();
