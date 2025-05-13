import { loadTimestamps, saveTimestamps, initFileTimestamp, updateModifiedTimestamp, cleanupDeletedFiles, updateFileAbbrlink } from './file-timestamps.mjs';
import { createHash } from 'crypto';
import { join, relative } from 'path';
import { readdirSync, statSync, watch, existsSync } from 'fs';

/**
 * 递归扫描目录找出所有 .md 和 .mdx 文件
 * @param {string} dir 要扫描的目录
 * @param {string} rootDir 根目录，用于计算相对路径
 * @returns {string[]} 文件路径数组
 */
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
        // 忽略无法访问的文件
      }
    }
  } catch (e) {
    // 忽略无法访问的目录
  }
  
  return results;
}

/**
 * 检查 abbrlink 是否已存在于其他文件中
 * @param {string} abbrlink 要检查的 abbrlink
 * @param {string} currentFilePath 当前文件路径 (相对路径)
 * @param {object} timestamps 时间戳数据对象
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
    console.log(`警告: 文件 ${relativePath} 生成的 abbrlink: ${abbrlink} 有重复，尝试生成新的...`);
    
    // 尝试使用不同位置的哈希值
    let found = false;
    for (let i = 1; i <= hash.length - 8; i++) {
      const newAbbrlink = hash.substring(i, i + 8);
      if (!isDuplicateAbbrlink(newAbbrlink, relativePath, timestamps)) {
        abbrlink = newAbbrlink;
        found = true;
        console.log(`为文件 ${relativePath} 生成新的 abbrlink: ${abbrlink}`);
        break;
      }
    }
    
    // 如果所有可能的组合都尝试过了还是有重复
    if (!found) {
      const uniqueHash = createHash('sha256')
        .update(relativePath + timeString + Date.now().toString())
        .digest('hex');
      abbrlink = uniqueHash.substring(0, 8);
      console.log(`为文件 ${relativePath} 使用时间戳增强生成新的 abbrlink: ${abbrlink}`);
    }
  }
  
  return abbrlink;
}

/**
 * 检查时间戳数据与实际文件系统的一致性
 * @param {string} contentDir 内容目录
 */
function validateTimestampConsistency(contentDir) {
  const timestamps = loadTimestamps();
  const contentFiles = scanContentFiles(contentDir);
  const relativeContentFiles = contentFiles.map(file => relative(process.cwd(), file).replace(/\\/g, '/'));
  
  // 检查是否有不存在的文件
  const timestampPaths = Object.keys(timestamps);
  const nonExistentFiles = timestampPaths.filter(path => !relativeContentFiles.includes(path));
  
  // 清理不存在的文件记录
  if (nonExistentFiles.length > 0) {
    console.log(`清理 ${nonExistentFiles.length} 个不存在的文件记录`);
    cleanupDeletedFiles(nonExistentFiles);
  }
  
  // 检查是否有新文件需要初始化
  let newFileCount = 0;
  let abbrlinksAdded = 0;
  
  // 先处理所有新文件
  for (const file of contentFiles) {
    const relativePath = relative(process.cwd(), file).replace(/\\/g, '/');
    if (!timestamps[relativePath]) {
      initFileTimestamp(file);
      newFileCount++;
    }
  }
  
  if (newFileCount > 0) {
    console.log(`初始化了 ${newFileCount} 个新文件的时间戳`);
  }
  
  // 重新加载时间戳
  const updatedTimestamps = loadTimestamps();
  
  // 然后检查和添加 abbrlink
  for (const file of contentFiles) {
    const relativePath = relative(process.cwd(), file).replace(/\\/g, '/');
    
    // 如果文件存在但没有 abbrlink，则添加
    if (updatedTimestamps[relativePath] && !updatedTimestamps[relativePath].abbrlink) {
      const abbrlink = generateUniqueAbbrlink(file, updatedTimestamps[relativePath].created, updatedTimestamps);
      updateFileAbbrlink(file, abbrlink);
      abbrlinksAdded++;
    }
  }
  
  if (abbrlinksAdded > 0) {
    console.log(`生成并添加了 ${abbrlinksAdded} 个文件的 abbrlink`);
  }
  
  return { 
    nonExistentFiles: nonExistentFiles.length, 
    newFiles: newFileCount,
    abbrlinksAdded
  };
}

/**
 * 设置文件系统监听器
 * @param {string} contentDir 内容目录路径
 */
function setupFileWatcher(contentDir) {
  if (!existsSync(contentDir)) {
    console.error(`内容目录不存在: ${contentDir}`);
    return null;
  }
  
  try {
    const watcher = watch(contentDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      
      // 只关注 markdown 文件
      if (!/\.(md|mdx)$/.test(filename)) return;
      
      const fullPath = join(contentDir, filename);
      
      switch (eventType) {
        case 'rename': // 创建或删除文件
          try {
            // 检查文件是否存在
            if (existsSync(fullPath)) {              
              // 文件存在，说明是新文件
              console.log(`[file-watcher] 检测到新文件: ${filename}`);
              
              // 初始化时间戳
              initFileTimestamp(fullPath);
              
              // 加载更新后的时间戳
              const timestamps = loadTimestamps();
              const relativePath = relative(process.cwd(), fullPath).replace(/\\/g, '/');
              
              // 检查并添加 abbrlink（如果需要）
              if (timestamps[relativePath] && !timestamps[relativePath].abbrlink) {
                const abbrlink = generateUniqueAbbrlink(fullPath, timestamps[relativePath].created, timestamps);
                updateFileAbbrlink(fullPath, abbrlink);
                console.log(`[file-watcher] 为新文件 ${relativePath} 生成 abbrlink: ${abbrlink}`);
              }
            } else {
              // 文件不存在，说明被删除了
              console.log(`[file-watcher] 检测到文件删除: ${filename}`);
              cleanupDeletedFiles([relative(process.cwd(), fullPath).replace(/\\/g, '/')]);
            }
          } catch (err) {
            // 忽略错误
            console.error(`[file-watcher] 处理文件 ${filename} 时出错:`, err);
          }
          break;
          
        case 'change': // 修改文件
          if (existsSync(fullPath)) {
            console.log(`[file-watcher] 检测到文件修改: ${filename}`);
            updateModifiedTimestamp(fullPath);
          }
          break;
      }
    });
    
    console.log(`已设置文件监听器，监控目录: ${contentDir}`);
    return watcher;
  } catch (error) {
    console.error(`设置文件监听器时出错: ${error.message}`);
    return null;
  }
}

/**
 * Astro 集成，用于在开发和构建阶段处理时间戳
 */
export default function timestampIntegration() {
  let fileWatcher = null;
  
  return {
    name: 'stalux-timestamp-integration',
    
    hooks: {      // 开发服务器启动时执行
      'astro:server:start': async () => {
        console.log('初始化文件时间戳和 abbrlink...');
        
        // 扫描内容目录
        const contentDir = join(process.cwd(), 'src', 'content');
        let timestamps = loadTimestamps();
        let initialCount = Object.keys(timestamps).length;
        
        try {
          // 扫描所有内容文件
          const contentFiles = scanContentFiles(contentDir);
          
          // 为每个文件初始化时间戳
          for (const filePath of contentFiles) {
            initFileTimestamp(filePath);
          }
          
          // 验证时间戳数据的一致性，同时处理 abbrlink
          const { nonExistentFiles, newFiles, abbrlinksAdded } = validateTimestampConsistency(contentDir);
          
          const newCount = Object.keys(loadTimestamps()).length;
          console.log(`时间戳和 abbrlink 数据已更新:`);
          console.log(`- ${newCount} 个文件记录总数`);
          console.log(`- ${newFiles} 个新增文件`);
          console.log(`- ${abbrlinksAdded} 个新增 abbrlink`);
          console.log(`- ${nonExistentFiles} 个已删除文件`);
          
          // 设置文件监听器
          fileWatcher = setupFileWatcher(contentDir);
        } catch (error) {
          console.error('初始化时间戳和 abbrlink 时出错:', error);
        }
      },
      
      // 开发服务器关闭时执行
      'astro:server:done': () => {
        if (fileWatcher) {
          console.log('关闭文件监听器');
          fileWatcher.close();
          fileWatcher = null;
        }
      },        // 文件变更时更新时间戳（仅在开发阶段）
      'astro:server:update': async ({ file }) => {
        if (/\.(md|mdx)$/.test(file)) {
          // 更新修改时间戳
          updateModifiedTimestamp(file);
          
          // 检查文件是否有 abbrlink，如果没有则添加
          const timestamps = loadTimestamps();
          const relativePath = relative(process.cwd(), file).replace(/\\/g, '/');
          
          if (timestamps[relativePath] && !timestamps[relativePath].abbrlink) {
            console.log(`[astro:update] 文件 ${relativePath} 没有 abbrlink，正在生成...`);
            const abbrlink = generateUniqueAbbrlink(file, timestamps[relativePath].created, timestamps);
            updateFileAbbrlink(file, abbrlink);
            console.log(`[astro:update] 为已修改文件生成 abbrlink: ${abbrlink}`);
          }
        }
      },
        // 构建开始前，仅加载时间戳数据，不做任何修改
      'astro:build:start': async () => {
        console.log('构建开始，使用现有时间戳数据...');
        
        try {
          // 只加载时间戳数据，不进行任何修改操作
          const timestamps = loadTimestamps();
          const timestampCount = Object.keys(timestamps).length;
          console.log(`已加载 ${timestampCount} 条时间戳数据记录`);
        } catch (error) {
          console.error('加载时间戳数据时出错:', error);
        }
      }
    }
  };
}
