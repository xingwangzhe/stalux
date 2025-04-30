// 尝试导入用户自定义配置
let userConfig;
try {
  userConfig = await import('../_config');
} catch (e) {
  // 如果_config.ts不存在或出错，则忽略错误
  userConfig = null;
}

// 导入默认配置
import { site as defaultConfig } from '../consts';

// 如果用户配置存在，则使用它，否则使用默认配置
export const config_site = userConfig?.config_site;