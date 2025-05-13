import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname, relative } from 'path';

// 时间戳数据的存储路径
const TIMESTAMP_FILE = join(process.cwd(), 'file-timestamps.json');

/**
 * 加载现有的时间戳数据
 */
export function loadTimestamps() {
  if (existsSync(TIMESTAMP_FILE)) {
    try {
      return JSON.parse(readFileSync(TIMESTAMP_FILE, 'utf-8'));
    } catch (e) {
      console.warn('无法解析时间戳文件，将创建新文件', e);
    }
  }
  return {};
}

/**
 * 保存时间戳数据
 */
export function saveTimestamps(timestamps) {
  try {
    // 确保文件所在目录存在
    const dir = dirname(TIMESTAMP_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    writeFileSync(TIMESTAMP_FILE, JSON.stringify(timestamps, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存时间戳文件时出错:', error);
  }
}

/**
 * 将 UTC 时间转换为东八区 (UTC+8) 时间
 * @param {Date} date UTC 日期对象
 * @returns {string} 东八区时间的 ISO 字符串
 */
function toUTC8(date) {
  // 获取用户本地时区的偏移量（分钟）
  const localOffset = date.getTimezoneOffset() * 60000;
  
  // 东八区的偏移量是 +8 小时，换算为毫秒
  const utc8Offset = 8 * 60 * 60 * 1000;
  
  // 创建一个新的调整后的时间
  const utc8Time = new Date(date.getTime() + localOffset + utc8Offset);
  
  // 返回 ISO 格式的时间字符串
  return utc8Time.toISOString();
}

/**
 * 初始化文件时间戳
 * 如果文件已有时间戳记录，则保留原有记录
 * 如果没有时间戳记录，则从文件系统获取时间并记录
 * @param {string} filepath 文件绝对路径
 * @returns {object} 更新后的时间戳对象
 */
export function initFileTimestamp(filepath) {
  const timestamps = loadTimestamps();
  const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
  
  // 如果文件不存在于记录中，从文件系统获取时间
  if (!timestamps[relativePath]) {
    try {
      const stats = statSync(filepath);
      // 优先使用birthtime，如果不可用或为无效日期，则使用ctime
      const createTime = stats.birthtime && stats.birthtime.getTime() 
        ? stats.birthtime 
        : stats.ctime;
      
      timestamps[relativePath] = {
        created: toUTC8(createTime),
        modified: toUTC8(stats.mtime)
      };
      
      saveTimestamps(timestamps);
    } catch (error) {
      // 忽略错误
    }
  }
  
  return timestamps;
}

/**
 * 更新文件的修改时间戳
 * @param {string} filepath 文件绝对路径
 * @returns {object} 更新后的时间戳对象
 */
export function updateModifiedTimestamp(filepath) {
  const timestamps = loadTimestamps();
  const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
  
  // 确保文件有初始时间戳
  if (!timestamps[relativePath]) {
    initFileTimestamp(filepath);
    return loadTimestamps();
  }
  
  try {
    const stats = statSync(filepath);
    // 更新修改时间，使用东八区时间
    timestamps[relativePath].modified = toUTC8(stats.mtime);
    saveTimestamps(timestamps);
  } catch (error) {
    // 忽略错误
  }
  
  return timestamps;
}

/**
 * 获取指定文件的时间戳
 * @param {string} filepath 文件绝对路径
 * @returns {object|null} 文件时间戳对象，如果不存在返回null
 */
export function getFileTimestamp(filepath) {
  const timestamps = loadTimestamps();
  const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
  
  if (!timestamps[relativePath]) {
    return null;
  }
  
  return timestamps[relativePath];
}

/**
 * 清理已删除文件的时间戳记录
 * @param {string[]} relativePaths 要清理的文件的相对路径
 */
export function cleanupDeletedFiles(relativePaths) {
  const timestamps = loadTimestamps();
  let changed = false;
  
  for (const path of relativePaths) {
    if (timestamps[path]) {
      delete timestamps[path];
      changed = true;
    }
  }
  
  if (changed) {
    saveTimestamps(timestamps);
    console.log(`已清理 ${relativePaths.length} 个已删除文件的时间戳记录`);
  }
  
  return timestamps;
}
