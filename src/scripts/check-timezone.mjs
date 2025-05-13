#!/usr/bin/env node
import { loadTimestamps } from '../utils/file-timestamps.mjs';

/**
 * 检查时间戳的时区
 * @param {string} isoString ISO 格式时间字符串
 * @returns {string} 时区信息
 */
function checkTimezone(isoString) {
  if (!isoString) return '未知';
  
  try {
    const date = new Date(isoString);
    
    // 提取时区信息
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    // 检查是否是常见时区
    if (hours === 0) {
      return 'UTC';
    } else if (hours === 8) {
      return 'UTC+8 (东八区)';
    } else {
      // 根据小时计算可能的时区
      if (hours < 12) {
        return `可能是 UTC+${hours}`;
      } else {
        return `可能是 UTC-${24 - hours}`;
      }
    }
  } catch (error) {
    return '时间解析错误';
  }
}

/**
 * 分析时间戳记录中的时区信息
 */
function analyzeTimezones() {
  console.log('分析时间戳的时区信息...');
  
  // 加载时间戳数据
  const timestamps = loadTimestamps();
  const files = Object.keys(timestamps);
  
  if (files.length === 0) {
    console.log('没有找到任何时间戳记录');
    return;
  }
  
  // 统计时区信息
  const timezones = {};
  
  for (const path of files) {
    const { created, modified } = timestamps[path];
    
    // 分析创建时间的时区
    const createdTimezone = checkTimezone(created);
    timezones[createdTimezone] = (timezones[createdTimezone] || 0) + 1;
    
    // 分析修改时间的时区
    const modifiedTimezone = checkTimezone(modified);
    timezones[modifiedTimezone] = (timezones[modifiedTimezone] || 0) + 1;
  }
  
  // 显示统计结果
  console.log(`\n时区统计 (基于 ${files.length} 个文件的创建和修改时间):`);
  for (const [timezone, count] of Object.entries(timezones)) {
    console.log(`- ${timezone}: ${count} 个记录`);
  }
  
  // 显示一些示例
  console.log('\n时间戳示例:');
  const sampleFiles = files.slice(0, 3);
  
  for (const path of sampleFiles) {
    const { created, modified } = timestamps[path];
    console.log(`\n文件: ${path}`);
    console.log(`  创建时间: ${created}`);
    console.log(`    - ISO 标准时间: ${created}`);
    console.log(`    - 本地显示时间: ${new Date(created).toLocaleString()}`);
    console.log(`    - 推测时区: ${checkTimezone(created)}`);
    
    console.log(`  修改时间: ${modified}`);
    console.log(`    - ISO 标准时间: ${modified}`);
    console.log(`    - 本地显示时间: ${new Date(modified).toLocaleString()}`);
    console.log(`    - 推测时区: ${checkTimezone(modified)}`);
  }
  
  // 显示时区转换示例
  const firstCreated = timestamps[files[0]]?.created;
  if (firstCreated) {
    const date = new Date(firstCreated);
    console.log('\n时区转换示例:');
    console.log(`原始 ISO: ${firstCreated}`);
    
    // 获取本地时区的偏移量（分钟）
    const localOffset = date.getTimezoneOffset();
    console.log(`本地时区偏移: ${-localOffset/60} 小时`);
    
    // 转换为东八区
    const utc8Time = new Date(date.getTime() + localOffset * 60000 + 8 * 60 * 60 * 1000);
    console.log(`东八区 ISO: ${utc8Time.toISOString()}`);
    console.log(`东八区时间: ${utc8Time.toLocaleString()}`);
  }
}

// 执行分析
analyzeTimezones();
