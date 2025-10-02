import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, Stats } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

// 类型定义
export interface FileTimestamp {
  created: string;
  modified: string;
  abbrlink?: string;
}

export interface TimestampsData {
  [relativePath: string]: FileTimestamp;
}

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 时间戳数据的存储路径
const TIMESTAMP_FILE = join(process.cwd(), 'file-timestamps.json');

// 缓存的时间戳数据，避免重复读取文件
let cachedTimestamps: TimestampsData | null = null;

/**
 * 加载现有的时间戳数据
 * 在开发环境下每次都读取文件，确保数据最新
 * 在构建环境下使用缓存数据避免多次读取
 */
export function loadTimestamps(): TimestampsData {
  // 如果是构建环境且已有缓存数据，直接返回缓存
  if (process.env.NODE_ENV === 'production' && cachedTimestamps) {
    return cachedTimestamps;
  }
  
  if (existsSync(TIMESTAMP_FILE)) {
    try {
      const data = JSON.parse(readFileSync(TIMESTAMP_FILE, 'utf-8')) as TimestampsData;
      // 缓存数据
      cachedTimestamps = data;
      return data;
    } catch (e) {
      console.warn('无法解析时间戳文件，将创建新文件', e);
    }
  }
  return {};
}

/**
 * 保存时间戳数据
 * 在构建环境中，不写入文件，只更新内存中的缓存
 */
export function saveTimestamps(timestamps: TimestampsData): void {
  // 在构建环境中不修改文件
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    console.log('[timestamp] 构建环境下不写入时间戳文件，仅更新内存缓存');
    cachedTimestamps = { ...timestamps };
    return;
  }
  
  try {
    // 确保文件所在目录存在
    const dir = dirname(TIMESTAMP_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // 更新缓存
    cachedTimestamps = { ...timestamps };
    // 写入文件
    writeFileSync(TIMESTAMP_FILE, JSON.stringify(timestamps, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存时间戳文件时出错:', error);
  }
}

/**
 * 将时间转换为本机时区时间，并附加时区信息
 */
function formatDateWithTimezone(date: Date): string {
  // 获取当前时区偏移（分钟）
  const tzOffset = date.getTimezoneOffset();
  
  // 计算时区字符串，如 "+08:00"
  const tzSign = tzOffset <= 0 ? "+" : "-";
  const tzHours = String(Math.abs(Math.floor(tzOffset / 60))).padStart(2, "0");
  const tzMinutes = String(Math.abs(tzOffset % 60)).padStart(2, "0");
  const tzString = `${tzSign}${tzHours}:${tzMinutes}`;
  
  // 格式化日期为 "YYYY-MM-DDThh:mm:ss.sss+HH:MM" 格式
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  
  // 返回带时区信息的时间字符串
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${tzString}`;
}

/**
 * 初始化文件时间戳
 * 如果文件已有时间戳记录，则保留原有记录
 * 如果没有时间戳记录，则从文件系统获取时间并记录
 */
export function initFileTimestamp(filepath: string, abbrlink?: string): TimestampsData {
  const timestamps = loadTimestamps();
  const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
  
  // 如果文件不存在于记录中，从文件系统获取时间
  if (!timestamps[relativePath]) {
    try {
      const stats: Stats = statSync(filepath);
      // 优先使用birthtime，如果不可用或为无效日期，则使用ctime
      const createTime = stats.birthtime && stats.birthtime.getTime() 
        ? stats.birthtime 
        : stats.ctime;
      
      // 创建时间戳记录
      timestamps[relativePath] = {
        created: formatDateWithTimezone(createTime),
        modified: formatDateWithTimezone(stats.mtime)
      };
      
      // 如果提供了 abbrlink，也保存起来
      if (abbrlink) {
        timestamps[relativePath].abbrlink = abbrlink;
      }
      
      saveTimestamps(timestamps);
    } catch (error) {
      // 忽略错误
      console.warn(`初始化时间戳失败: ${filepath}`, error);
    }
  } else if (abbrlink && !timestamps[relativePath].abbrlink) {
    // 如果文件记录已存在但没有 abbrlink，且提供了 abbrlink，则更新它
    timestamps[relativePath].abbrlink = abbrlink;
    saveTimestamps(timestamps);
  }
  
  return timestamps;
}

/**
 * 更新文件的修改时间戳
 */
export function updateModifiedTimestamp(filepath: string): TimestampsData {
  const timestamps = loadTimestamps();
  const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
  
  // 确保文件有初始时间戳
  if (!timestamps[relativePath]) {
    initFileTimestamp(filepath);
    return loadTimestamps();
  }
  
  try {
    const stats: Stats = statSync(filepath);
    // 更新修改时间，使用本机时区时间
    timestamps[relativePath].modified = formatDateWithTimezone(stats.mtime);
    saveTimestamps(timestamps);
  } catch (error) {
    // 忽略错误
    console.warn(`更新修改时间戳失败: ${filepath}`, error);
  }
  
  return timestamps;
}

/**
 * 获取指定文件的时间戳
 */
export function getFileTimestamp(filepath: string): FileTimestamp | null {
  const timestamps = loadTimestamps();
  const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
  
  return timestamps[relativePath] || null;
}

/**
 * 清理已删除文件的时间戳记录
 */
export function cleanupDeletedFiles(relativePaths: string[]): TimestampsData {
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

/**
 * 更新文件的 abbrlink
 */
export function updateFileAbbrlink(filepath: string, abbrlink: string): TimestampsData {
  const timestamps = loadTimestamps();
  const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
  
  // 确保文件有初始时间戳
  if (!timestamps[relativePath]) {
    console.log(`[file-timestamps] 文件 ${relativePath} 没有时间戳记录，初始化...`);
    initFileTimestamp(filepath);
  }
  
  // 检查是否已有 abbrlink
  const hadAbbrlink = timestamps[relativePath]?.abbrlink;
  const existingAbbrlink = hadAbbrlink || null;
  
  // 更新或添加 abbrlink
  if (timestamps[relativePath]) {
    if (hadAbbrlink && existingAbbrlink !== abbrlink) {
      console.log(`[file-timestamps] 警告: 正在更改文件 ${relativePath} 的 abbrlink 从 ${existingAbbrlink} 到 ${abbrlink}`);
    }
    
    timestamps[relativePath].abbrlink = abbrlink;
    saveTimestamps(timestamps);
    
    if (!hadAbbrlink) {
      console.log(`[file-timestamps] 为文件 ${relativePath} 添加 abbrlink: ${abbrlink}`);
    }
  }
  
  return timestamps;
}
