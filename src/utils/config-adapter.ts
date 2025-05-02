// 导入默认配置
import { site as defaultConfig } from '../consts';
// 尝试导入用户自定义配置
let userConfig;
try {
  // 使用require替代动态import来加载配置
  userConfig = require('../_config');
} catch (e) {
  // 如果_config.ts不存在或出错，则忽略错误
  userConfig = null;
}

/**
 * 深度合并两个对象，用于合并配置
 * @param target 目标对象（默认配置）
 * @param source 源对象（用户配置）
 * @returns 合并后的新对象
 */
function deepMerge(target:any, source:any) {
  if (!source) return target;
  
  // 创建目标对象的副本
  const output = { ...target };
  
  // 遍历源对象的所有属性
  Object.keys(source).forEach(key => {
    // 如果源对象的属性值是对象且目标对象也有该属性且也是对象，则递归合并
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
        target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      output[key] = deepMerge(target[key], source[key]);
    } 
    // 否则直接赋值（源对象的值覆盖目标对象的值）
    else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  });
  
  return output;
}

// 合并配置：首先使用用户配置，如果不存在或不完整，则使用默认配置进行补充
export const config_site = deepMerge(defaultConfig, userConfig?.config_site);