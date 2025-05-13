import { statSync } from 'fs';
import { getFileTimestamp, initFileTimestamp } from './file-timestamps.mjs';

export function remarkModifiedTime() {
    return function (tree, file) {
      const filepath = file.history[0];
      
      // 尝试从时间戳文件中获取时间
      let timestamp = getFileTimestamp(filepath);
      
      // 如果找不到时间戳数据，初始化它
      if (!timestamp) {
        initFileTimestamp(filepath);
        timestamp = getFileTimestamp(filepath);
      }
      
      if (timestamp) {
        // 使用保存的时间戳
        file.data.astro.frontmatter.date = timestamp.created;
        file.data.astro.frontmatter.updated = timestamp.modified;
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