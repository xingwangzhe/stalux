#!/usr/bin/env node
import { loadTimestamps, saveTimestamps } from '../utils/file-timestamps.mjs';

/**
 * 将 UTC 时间转换为东八区 (UTC+8) 时间字符串
 * @param {string} isoString ISO 格式时间字符串
 * @returns {string} 东八区的 ISO 格式时间字符串
 */
function convertToUTC8(isoString) {
  if (!isoString) return isoString;
  
  try {
    const date = new Date(isoString);
    
    // 获取用户本地时区的偏移量（分钟）
    const localOffset = date.getTimezoneOffset() * 60000;
    
    // 东八区的偏移量是 +8 小时，换算为毫秒
    const utc8Offset = 8 * 60 * 60 * 1000;
    
    // 创建一个新的调整后的时间
    const utc8Time = new Date(date.getTime() + localOffset + utc8Offset);
    
    // 返回 ISO 格式的时间字符串
    return utc8Time.toISOString();
  } catch (error) {
    console.error(`时间转换错误 (${isoString}): ${error.message}`);
    return isoString;
  }
}

/**
 * 将所有时间戳转换为东八区时间
 */
function convertAllTimestampsToUTC8() {
  console.log('开始将所有时间戳转换为东八区 (UTC+8) 时间...');
  
  // 加载当前的时间戳数据
  const timestamps = loadTimestamps();
  const fileCount = Object.keys(timestamps).length;
  
  if (fileCount === 0) {
    console.log('没有找到任何时间戳记录');
    return;
  }
  
  console.log(`开始处理 ${fileCount} 个文件的时间戳`);
  
  // 转换所有时间戳
  let convertedCount = 0;
  
  for (const [path, data] of Object.entries(timestamps)) {
    const oldCreated = data.created;
    const oldModified = data.modified;
    
    const newCreated = convertToUTC8(oldCreated);
    const newModified = convertToUTC8(oldModified);
    
    if (oldCreated !== newCreated || oldModified !== newModified) {
      timestamps[path].created = newCreated;
      timestamps[path].modified = newModified;
      convertedCount++;
    }
  }
  
  // 保存更新后的数据
  if (convertedCount > 0) {
    saveTimestamps(timestamps);
    console.log(`已将 ${convertedCount} 个文件的时间戳转换为东八区时间`);
    
    // 显示一些示例
    console.log('\n转换后的时间戳示例:');
    const sampleFiles = Object.keys(timestamps).slice(0, 3);
    for (const path of sampleFiles) {
      const { created, modified } = timestamps[path];
      console.log(`- ${path}`);
      console.log(`  创建时间: ${created}`);
      console.log(`  修改时间: ${modified}`);
    }
  } else {
    console.log('所有时间戳已经是东八区格式，无需转换');
  }
}

// 执行转换
convertAllTimestampsToUTC8();
