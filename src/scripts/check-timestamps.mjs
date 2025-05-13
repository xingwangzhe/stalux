import { loadTimestamps } from '../utils/file-timestamps.mjs';

// 打印当前时间戳信息，用于调试
function printTimestampInfo() {
  const timestamps = loadTimestamps();
  const fileCount = Object.keys(timestamps).length;
  
  console.log(`--------------------------------------`);
  console.log(`文件时间戳概览 (共 ${fileCount} 个文件):`);
  console.log(`--------------------------------------`);
  
  if (fileCount > 0) {
    // 选取前5个文件作为示例
    const sampleFiles = Object.keys(timestamps).slice(0, 5);
    
    for (const file of sampleFiles) {
      const { created, modified } = timestamps[file];
      console.log(`文件: ${file}`);
      console.log(`  创建时间: ${created}`);
      console.log(`  修改时间: ${modified}`);
      console.log(`--------------------------------------`);
    }
    
    if (fileCount > 5) {
      console.log(`... 还有 ${fileCount - 5} 个文件 ...`);
    }
  } else {
    console.log('没有找到任何时间戳记录');
  }
}

// 执行打印
printTimestampInfo();
