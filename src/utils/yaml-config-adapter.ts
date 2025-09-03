import type { SiteConfig } from '../types';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';

// 默认配置的缓存
let defaultConfig: SiteConfig | null = null;
let userConfig: SiteConfig | null = null;
let finalConfig: SiteConfig | null = null;

/**
 * 从 YAML 文件加载配置
 */
function loadYamlConfig(filePath: string): SiteConfig | null {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    
    const yamlContent = readFileSync(filePath, 'utf-8');
    
    // 检查文件是否为空
    if (!yamlContent.trim()) {
      return null;
    }
    
    const config = load(yamlContent) as SiteConfig;
    
    // 验证配置是否有效
    if (!config || typeof config !== 'object') {
      console.warn(`配置文件 ${filePath} 格式无效`);
      return null;
    }
    
    return config;
  } catch (error) {
    console.warn(`加载配置文件 ${filePath} 失败:`, error);
    return null;
  }
}

/**
 * 深度合并配置对象
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (sourceValue !== undefined && sourceValue !== null) {
        if (isObject(targetValue) && isObject(sourceValue)) {
          result[key] = deepMerge(targetValue, sourceValue);
        } else {
          result[key] = sourceValue;
        }
      }
    }
  }
  
  return result;
}

/**
 * 类型守卫函数
 */
function isObject(item: any): item is Record<string, any> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

/**
 * 获取项目根目录路径
 */
function getProjectRoot(): string {
  // 在构建时和运行时都能正确工作的路径解析
  if (typeof process !== 'undefined' && process.cwd) {
    return process.cwd();
  }
  // 回退方案
  return '/';
}

/**
 * 加载默认配置
 */
function loadDefaultConfig(): SiteConfig {
  if (defaultConfig) {
    return defaultConfig;
  }
  
  const projectRoot = getProjectRoot();
  const defaultConfigPath = join(projectRoot, '_stalux.yml');
  
  const config = loadYamlConfig(defaultConfigPath);
  
  if (!config) {
    throw new Error('无法加载默认配置文件 _stalux.yml');
  }
  
  defaultConfig = config;
  return defaultConfig;
}

/**
 * 加载用户配置
 */
function loadUserConfig(): SiteConfig | null {
  if (userConfig !== null) {
    return userConfig;
  }
  
  const projectRoot = getProjectRoot();
  const userConfigPath = join(projectRoot, '_config.yml');
  
  userConfig = loadYamlConfig(userConfigPath);
  return userConfig;
}

/**
 * 获取最终配置
 */
export function getConfig(): SiteConfig {
  if (finalConfig) {
    return finalConfig;
  }
  
  try {
    // 加载默认配置
    const defaultConf = loadDefaultConfig();
    
    // 加载用户配置
    const userConf = loadUserConfig();
    
    // 合并配置，用户配置优先
    finalConfig = userConf ? deepMerge(defaultConf, userConf) : defaultConf;
    
    console.log('配置加载成功:', {
      hasUserConfig: !!userConf,
      configUrl: finalConfig.url,
      configTitle: finalConfig.title
    });
    
    return finalConfig;
  } catch (error) {
    console.error('配置加载失败:', error);
    
    // 返回最小化的错误配置
    const fallbackConfig: SiteConfig = {
      title: 'Stalux博客主题',
      description: '博客主题Stalux',
      url: 'https://localhost:4321'
    };
    
    return fallbackConfig;
  }
}

/**
 * 重置配置缓存（用于热重载等场景）
 */
export function resetConfigCache(): void {
  defaultConfig = null;
  userConfig = null;
  finalConfig = null;
}

/**
 * 导出配置实例（保持向后兼容性）
 */
export const config_site = getConfig();
