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
 * 将时间转换为本机时区时间，并附加时区信息
 * @param {Date} date 日期对象
 * @returns {string} 带时区信息的时间字符串
 */
function formatDateWithTimezone(date) {
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
 * @param {string} filepath 文件绝对路径
 * @param {string} [abbrlink] 可选的 abbrlink 值
 * @returns {object} 更新后的时间戳对象
 */
export function initFileTimestamp(filepath, abbrlink) {
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
    const stats = statSync(filepath);    // 更新修改时间，使用本机时区时间
    timestamps[relativePath].modified = formatDateWithTimezone(stats.mtime);
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

/**
 * 更新文件的 abbrlink
 * @param {string} filepath 文件绝对路径
 * @param {string} abbrlink abbrlink 值
 * @returns {object} 更新后的时间戳对象
 */
export function updateFileAbbrlink(filepath, abbrlink) {
  const timestamps = loadTimestamps();
  const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
  
  // 确保文件有初始时间戳
  if (!timestamps[relativePath]) {
    console.log(`[file-timestamps] 文件 ${relativePath} 没有时间戳记录，初始化...`);
    initFileTimestamp(filepath);
  }
  
  // 检查是否已有 abbrlink
  const hadAbbrlink = timestamps[relativePath] && timestamps[relativePath].abbrlink;
  const existingAbbrlink = hadAbbrlink ? timestamps[relativePath].abbrlink : null;
  
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
