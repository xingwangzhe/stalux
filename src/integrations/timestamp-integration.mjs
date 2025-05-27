import { loadTimestamps, initFileTimestamp, updateModifiedTimestamp, cleanupDeletedFiles, updateFileAbbrlink } from './file-timestamps.mjs';
import { createHash } from 'crypto';
import { join, relative } from 'path';
import { readdirSync, statSync, watch, existsSync } from 'fs';

function scanContentFiles(dir, rootDir = dir) {
  let results = [];
  
  try {
    const files = readdirSync(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      
      try {
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
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

function generateUniqueAbbrlink(filepath, createdTime, timestamps) {
  const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
  const timeString = new Date(createdTime).getTime().toString();
  
  const hash = createHash('sha256')
    .update(relativePath + timeString)
    .digest('hex');
  
  let abbrlink = hash.substring(0, 8);
  
  if (isDuplicateAbbrlink(abbrlink, relativePath, timestamps)) {
    let found = false;
    for (let i = 1; i <= hash.length - 8; i++) {
      const newAbbrlink = hash.substring(i, i + 8);
      if (!isDuplicateAbbrlink(newAbbrlink, relativePath, timestamps)) {
        abbrlink = newAbbrlink;
        found = true;
        break;
      }
    }
    
    if (!found) {
      const uniqueHash = createHash('sha256')
        .update(relativePath + timeString + Date.now().toString())
        .digest('hex');
      abbrlink = uniqueHash.substring(0, 8);
    }
  }
  
  return abbrlink;
}

function validateTimestampConsistency(contentDir) {
  const timestamps = loadTimestamps();
  const contentFiles = scanContentFiles(contentDir);
  const relativeContentFiles = contentFiles.map(file => relative(process.cwd(), file).replace(/\\/g, '/'));
  
  const timestampPaths = Object.keys(timestamps);
  const nonExistentFiles = timestampPaths.filter(path => !relativeContentFiles.includes(path));
  
  if (nonExistentFiles.length > 0) {
    cleanupDeletedFiles(nonExistentFiles);
  }
  
  let newFileCount = 0;
  let abbrlinksAdded = 0;
  
  for (const file of contentFiles) {
    const relativePath = relative(process.cwd(), file).replace(/\\/g, '/');
    if (!timestamps[relativePath]) {
      initFileTimestamp(file);
      newFileCount++;
    }
  }
  
  const updatedTimestamps = loadTimestamps();
  
  for (const file of contentFiles) {
    const relativePath = relative(process.cwd(), file).replace(/\\/g, '/');
    
    if (updatedTimestamps[relativePath] && !updatedTimestamps[relativePath].abbrlink) {
      const abbrlink = generateUniqueAbbrlink(file, updatedTimestamps[relativePath].created, updatedTimestamps);
      updateFileAbbrlink(file, abbrlink);
      abbrlinksAdded++;
    }
  }
  
  return { 
    nonExistentFiles: nonExistentFiles.length, 
    newFiles: newFileCount,
    abbrlinksAdded
  };
}

function setupFileWatcher(contentDir) {
  if (!existsSync(contentDir)) {
    console.error(`内容目录不存在: ${contentDir}`);
    return null;
  }
  
  try {
    const watcher = watch(contentDir, { recursive: true }, (eventType, filename) => {
      if (!filename || !/\.(md|mdx)$/.test(filename)) return;
      
      const fullPath = join(contentDir, filename);
      
      if (eventType === 'rename') {
        try {
          if (existsSync(fullPath)) {
            initFileTimestamp(fullPath);
            
            const timestamps = loadTimestamps();
            const relativePath = relative(process.cwd(), fullPath).replace(/\\/g, '/');
            
            if (timestamps[relativePath] && !timestamps[relativePath].abbrlink) {
              const abbrlink = generateUniqueAbbrlink(fullPath, timestamps[relativePath].created, timestamps);
              updateFileAbbrlink(fullPath, abbrlink);
            }
          } else {
            cleanupDeletedFiles([relative(process.cwd(), fullPath).replace(/\\/g, '/')]);
          }
        } catch (err) {
          console.error(`处理文件 ${filename} 时出错:`, err);
        }
      } else if (eventType === 'change') {
        if (existsSync(fullPath)) {
          updateModifiedTimestamp(fullPath);
        }
      }
    });
    
    return watcher;
  } catch (error) {
    console.error(`设置文件监听器时出错: ${error.message}`);
    return null;
  }
}

export default function timestampIntegration() {
  let fileWatcher = null;
  
  return {
    name: 'stalux-timestamp-integration',
    
    hooks: {
      'astro:server:start': async () => {
        const contentDir = join(process.cwd(), 'src', 'content');
        
        try {
          const contentFiles = scanContentFiles(contentDir);
          
          for (const filePath of contentFiles) {
            initFileTimestamp(filePath);
          }
          
          validateTimestampConsistency(contentDir);
          fileWatcher = setupFileWatcher(contentDir);
        } catch (error) {
          console.error('初始化时间戳和 abbrlink 时出错:', error);
        }
      },
      
      'astro:server:done': () => {
        if (fileWatcher) {
          fileWatcher.close();
          fileWatcher = null;
        }
      },
      
      'astro:server:update': async ({ file }) => {
        if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
          return;
        }
        
        if (/\.(md|mdx)$/.test(file)) {
          updateModifiedTimestamp(file);
          
          const timestamps = loadTimestamps();
          const relativePath = relative(process.cwd(), file).replace(/\\/g, '/');
          
          if (timestamps[relativePath] && !timestamps[relativePath].abbrlink) {
            const abbrlink = generateUniqueAbbrlink(file, timestamps[relativePath].created, timestamps);
            updateFileAbbrlink(file, abbrlink);
          }
        }
      },
      
      'astro:build:start': async () => {
        try {
          process.env.NODE_ENV = 'production';
          loadTimestamps();
        } catch (error) {
          console.error('加载时间戳数据时出错:', error);
        }
      }
    }
  };
}
