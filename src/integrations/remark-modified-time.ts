import { statSync } from 'fs';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import { getFileTimestamp, initFileTimestamp } from './file-timestamps.js';

export function remarkModifiedTime() {
  return function (tree: Root, file: VFile): void {
    const filepath = file.history[0];
    
    if (!filepath) {
      console.warn('[remark-modified-time] 无法获取文件路径');
      return;
    }
    
    // 类型保护：确保 file.data.astro 和 frontmatter 存在
    if (!file.data.astro?.frontmatter) {
      console.warn('[remark-modified-time] 文件没有 frontmatter');
      return;
    }
    
    // 尝试从时间戳文件中获取时间
    let timestamp = getFileTimestamp(filepath);
    
    // 如果找不到时间戳数据，仅在非构建环境下初始化它
    if (!timestamp) {
      if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
        // 仅在开发环境下创建新的时间戳
        initFileTimestamp(filepath);
        timestamp = getFileTimestamp(filepath);
      } else {
        // 在构建环境下使用文件系统信息，但不保存
        const stats = statSync(filepath);
        const createTime = new Date(Math.min(
          stats.birthtime.getTime(),
          stats.ctime.getTime()
        ));
        timestamp = {
          created: createTime.toISOString(),
          modified: stats.mtime.toISOString()
        };
      }
    }
    
    if (timestamp) {
      // 使用保存的时间戳，但确保时区信息正确
      file.data.astro.frontmatter.date = timestamp.created;
      file.data.astro.frontmatter.updated = timestamp.modified;
      
      if (process.env.NODE_ENV !== 'production') {
        //console.log(`[remark-modified-time] 文件 ${filepath} 使用时间戳: ${timestamp.created}, ${timestamp.modified}`);
      }
    } else {
      // 作为备选方案，使用文件系统时间
      const stats = statSync(filepath);
      
      // 使用 ctime 和 birthtime 中较早的时间作为文件创建时间
      const createTime = new Date(Math.min(
        stats.birthtime.getTime(),
        stats.ctime.getTime()
      ));
      file.data.astro.frontmatter.date = createTime.toISOString();
      
      // 使用mtime作为文件修改时间
      file.data.astro.frontmatter.updated = stats.mtime.toISOString();
    }
  };
}
