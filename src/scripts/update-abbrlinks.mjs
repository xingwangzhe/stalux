/**
 * 脚本用于更新现有文件的 abbrlink 到 timestamps 文件中
 */
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { createHash } from 'crypto';
import { loadTimestamps, saveTimestamps } from '../integrations/file-timestamps.mjs';

// 递归扫描目录找出所有 .md 和 .mdx 文件
function scanContentFiles(dir, rootDir = dir) {
  let results = [];
  
  try {
    const files = readdirSync(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      
      try {
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
          // 忽略 node_modules 和 .git 等目录
          if (!file.startsWith('.') && file !== 'node_modules') {
            results = results.concat(scanContentFiles(filePath, rootDir));
          }
        } else if (/\.(md|mdx)$/.test(file)) {
          results.push(filePath);
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore
  }
  
  return results;
}

/**
 * 检查 abbrlink 是否已存在于其他文件中
 * @param {string} abbrlink 要检查的 abbrlink
 * @param {string} currentFilePath 当前文件路径 (相对路径)
 * @returns {boolean} 如果存在重复返回 true，否则返回 false
 */
function isDuplicateAbbrlink(abbrlink, currentFilePath, timestamps) {
  for (const path in timestamps) {
    if (path !== currentFilePath && 
        timestamps[path].abbrlink && 
        timestamps[path].abbrlink === abbrlink) {
      return true;
    }
  }
  
  return false;
}

/**
 * 为文件生成唯一的 abbrlink
 * @param {string} filepath 文件路径
 * @param {string} createdTime 创建时间
 * @param {object} timestamps 时间戳数据对象
 * @returns {string} 生成的 abbrlink
 */
function generateUniqueAbbrlink(filepath, createdTime, timestamps) {
  const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
  const timeString = new Date(createdTime).getTime().toString();
  
  const hash = createHash('sha256')
    .update(relativePath + timeString)
    .digest('hex');
  
  // 首先尝试使用前8位作为 abbrlink
  let abbrlink = hash.substring(0, 8);
  
  // 检查是否重复
  if (isDuplicateAbbrlink(abbrlink, relativePath, timestamps)) {
    // 尝试使用不同位置的哈希值
    let found = false;
    for (let i = 1; i <= hash.length - 8; i++) {
      const newAbbrlink = hash.substring(i, i + 8);
      if (!isDuplicateAbbrlink(newAbbrlink, relativePath, timestamps)) {
        abbrlink = newAbbrlink;
        found = true;
        break;
      }
    }
    
    // 如果所有可能的组合都尝试过了还是有重复
    if (!found) {
      const uniqueHash = createHash('sha256')
        .update(relativePath + timeString + Date.now().toString())
        .digest('hex');
      abbrlink = uniqueHash.substring(0, 8);
    }
  }
  
  return abbrlink;
}

// 更新所有文件的 abbrlink
async function updateAllAbbrlinks() {
  // 加载时间戳数据
  const timestamps = loadTimestamps();
  
  // 扫描内容目录
  const contentDir = join(process.cwd(), 'src', 'content');
  const contentFiles = scanContentFiles(contentDir);
  
  // 记录各种统计
  let updated = 0;
  let added = 0;
  let unchanged = 0;
  let duplicates = 0;
  
  // 为每个文件处理 abbrlink
  for (const filepath of contentFiles) {
    const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
    
    // 如果文件没有时间戳记录，跳过
    if (!timestamps[relativePath]) {
      continue;
    }
    
    // 检查是否已有 abbrlink
    if (timestamps[relativePath].abbrlink) {
      unchanged++;
      continue;
    }
    
    // 使用统一的函数生成新的 abbrlink
    let abbrlink = generateUniqueAbbrlink(filepath, timestamps[relativePath].created, timestamps);
    
    // 检查是否与简单哈希不同（表示发生了重复处理）
    const simpleHash = createHash('sha256')
      .update(relativePath + new Date(timestamps[relativePath].created).getTime().toString())
      .digest('hex').substring(0, 8);
    
    if (abbrlink !== simpleHash) {
      duplicates++;
    }
    
    // 更新 abbrlink
    timestamps[relativePath].abbrlink = abbrlink;
    added++;
  }
  
  // 保存时间戳数据
  saveTimestamps(timestamps);
}

// 执行更新
updateAllAbbrlinks().catch(error => {
  console.error('更新 abbrlink 时出错:', error);
  process.exit(1);
});
