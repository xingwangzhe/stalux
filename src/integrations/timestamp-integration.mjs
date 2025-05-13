import { loadTimestamps, saveTimestamps, initFileTimestamp, updateModifiedTimestamp, cleanupDeletedFiles } from '../utils/file-timestamps.mjs';
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
  
  return { nonExistentFiles: nonExistentFiles.length, newFiles: newFileCount };
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
              console.log(`检测到新文件: ${filename}`);
              initFileTimestamp(fullPath);
            } else {
              // 文件不存在，说明被删除了
              console.log(`检测到文件删除: ${filename}`);
              cleanupDeletedFiles([relative(process.cwd(), fullPath).replace(/\\/g, '/')]);
            }
          } catch (err) {
            // 忽略错误
          }
          break;
          
        case 'change': // 修改文件
          if (existsSync(fullPath)) {
            console.log(`检测到文件修改: ${filename}`);
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
    
    hooks: {
      // 开发服务器启动时执行
      'astro:server:start': async () => {
        console.log('初始化文件时间戳...');
        
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
          
          // 验证时间戳数据的一致性
          const { nonExistentFiles, newFiles } = validateTimestampConsistency(contentDir);
          
          const newCount = Object.keys(loadTimestamps()).length;
          console.log(`时间戳数据已更新，现有 ${newCount} 个文件记录`);
          
          // 设置文件监听器
          fileWatcher = setupFileWatcher(contentDir);
        } catch (error) {
          console.error('初始化时间戳时出错:', error);
        }
      },
      
      // 开发服务器关闭时执行
      'astro:server:done': () => {
        if (fileWatcher) {
          console.log('关闭文件监听器');
          fileWatcher.close();
          fileWatcher = null;
        }
      },
      
      // 文件变更时更新时间戳
      'astro:server:update': async ({ file }) => {
        if (/\.(md|mdx)$/.test(file)) {
          // 更新修改时间戳
          updateModifiedTimestamp(file);
        }
      },
      //构建别更新时间戳
    }
  };
}
