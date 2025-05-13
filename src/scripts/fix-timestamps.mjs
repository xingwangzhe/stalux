#!/usr/bin/env node
import { loadTimestamps, saveTimestamps, initFileTimestamp, cleanupDeletedFiles } from '../utils/file-timestamps.mjs';
import { join, relative } from 'path';
import { readdirSync, statSync, existsSync } from 'fs';

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
 * 验证并修复时间戳数据
 */
function validateAndFixTimestamps() {
  console.log('开始验证时间戳数据...');
  
  // 加载当前时间戳数据
  const timestamps = loadTimestamps();
  const timestampPaths = Object.keys(timestamps);
  console.log(`当前时间戳记录数: ${timestampPaths.length}`);
  
  // 扫描实际文件系统
  const contentDir = join(process.cwd(), 'src', 'content');
  if (!existsSync(contentDir)) {
    console.error(`内容目录不存在: ${contentDir}`);
    return;
  }
  
  const contentFiles = scanContentFiles(contentDir);
  const relativeContentFiles = contentFiles.map(file => 
    relative(process.cwd(), file).replace(/\\/g, '/')
  );
  console.log(`实际文件数: ${relativeContentFiles.length}`);
  
  // 检查不存在的文件记录
  const nonExistentFiles = timestampPaths.filter(path => !relativeContentFiles.includes(path));
  console.log(`需要清理的记录数: ${nonExistentFiles.length}`);
  
  // 检查缺失的文件记录
  const missingFiles = contentFiles.filter(file => {
    const relativePath = relative(process.cwd(), file).replace(/\\/g, '/');
    return !timestamps[relativePath];
  });
  console.log(`需要新增的记录数: ${missingFiles.length}`);
  
  // 进行清理和新增操作
  if (nonExistentFiles.length > 0) {
    cleanupDeletedFiles(nonExistentFiles);
  }
  
  if (missingFiles.length > 0) {
    for (const file of missingFiles) {
      initFileTimestamp(file);
    }
    console.log(`已为 ${missingFiles.length} 个文件初始化时间戳`);
  }
  
  // 输出最终状态
  const finalTimestamps = loadTimestamps();
  console.log(`完成! 当前时间戳记录总数: ${Object.keys(finalTimestamps).length}`);
  
  // 打印一些示例数据
  console.log('\n时间戳数据示例:');
  const sampleFiles = Object.keys(finalTimestamps).slice(0, 3);
  for (const path of sampleFiles) {
    const { created, modified } = finalTimestamps[path];
    console.log(`- ${path}`);
    console.log(`  创建时间: ${created}`);
    console.log(`  修改时间: ${modified}`);
  }
  
  if (Object.keys(finalTimestamps).length > 3) {
    console.log(`... 以及其他 ${Object.keys(finalTimestamps).length - 3} 个文件记录 ...`);
  }
}

// 执行验证和修复
validateAndFixTimestamps();
