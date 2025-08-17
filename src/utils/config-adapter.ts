// 导入默认配置
import type { SiteConfig } from '../types';
import { site as defaultConfig } from '../consts';

// 创建一个Promise来处理异步配置加载
let configPromise: Promise<SiteConfig> | null = null;

// 更现代化的配置加载函数
async function loadConfig(): Promise<SiteConfig> {
  try {
    // 动态导入用户配置
    const userConfigModule = await import('../_config').catch(() => null);
    
    // 类型守卫检查
    if (userConfigModule && typeof userConfigModule === 'object' && userConfigModule.useConfig === true) {
      // 合并配置，用户配置优先
      return deepMerge(defaultConfig, userConfigModule.siteConfig);
    }
  } catch (error) {
    // 如果导入失败，这表示用户没有创建配置文件，这是正常的
    console.debug('未找到用户配置文件或配置文件有误，使用默认配置');
  }
  
  // 返回默认配置
  return defaultConfig;
}

// 深度合并函数，用于合并默认配置和用户配置
function deepMerge<T extends Record<string, any>>(defaultObj: T, userObj: Partial<T>): T {
  const result = { ...defaultObj } as T;
  
  for (const key in userObj) {
    if (userObj.hasOwnProperty(key)) {
      const userValue = userObj[key];
      const defaultValue = result[key];
      
      if (userValue !== undefined) {
        if (isObject(defaultValue) && isObject(userValue)) {
          result[key] = deepMerge(defaultValue, userValue);
        } else {
          result[key] = userValue;
        }
      }
    }
  }
  
  return result;
}

// 类型守卫函数
function isObject(item: any): item is Record<string, any> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

// 导出配置Promise，供应用其他部分使用
export function getConfig(): Promise<SiteConfig> {
  if (!configPromise) {
    configPromise = loadConfig();
  }
  return configPromise;
}

// 也导出一个同步获取配置的方法（如果已经加载完成）
export let config_site: SiteConfig = defaultConfig;

// 立即执行的异步函数来更新配置
(async () => {
  try {
    config_site = await getConfig();
  } catch (error) {
    console.warn('配置加载失败，使用默认配置:', error);
  }
})();