import { statSync } from 'fs';
import { createHash } from 'crypto';
import { getFileTimestamp, initFileTimestamp, updateFileAbbrlink, loadTimestamps } from './file-timestamps.mjs';
import { relative } from 'path';

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

export function remarkModifiedAbbrlink() {
    return function (tree, file) {
        // 获取文件路径
        const filepath = file.history[0];
        const relativePath = relative(process.cwd(), filepath).replace(/\\/g, '/');
        
        // 尝试从时间戳文件中获取数据
        let timestamp = getFileTimestamp(filepath);
        
        // 如果找不到时间戳数据，初始化它
        if (!timestamp) {
            console.log(`[remark-abbrlink] 文件 ${relativePath} 没有时间戳记录，初始化...`);
            initFileTimestamp(filepath);
            timestamp = getFileTimestamp(filepath);
        }
        
        // 检查时间戳数据中是否已有 abbrlink
        if (timestamp && timestamp.abbrlink) {
            // 如果已有 abbrlink，直接使用
            const abbrlink = timestamp.abbrlink;
            //console.log(`[remark-abbrlink] 文件 ${relativePath} 使用现有 abbrlink: ${abbrlink}`);
            file.data.astro.frontmatter.abbrlink = abbrlink;
            return;
        }
          // 否则，需要生成新的 abbrlink
        let createdTime;
        const timestamps = loadTimestamps();
        
        if (timestamp) {
            // 使用持久化的创建时间来生成稳定的哈希值
            createdTime = timestamp.created;
        } else {
            // 作为备选方案，使用文件系统时间
            const stats = statSync(filepath);
            createdTime = (stats.birthtime && stats.birthtime.getTime()) 
                ? new Date(stats.birthtime).toISOString()
                : new Date(stats.ctime).toISOString();
        }
        
        console.log(`[remark-abbrlink] 为文件 ${relativePath} 生成 abbrlink...`);
        
        // 使用统一的 abbrlink 生成函数
        let abbrlink = generateUniqueAbbrlink(filepath, createdTime, timestamps);
          // 在非构建环境下将生成的abbrlink更新到时间戳文件中
        if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
          updateFileAbbrlink(filepath, abbrlink);
        } else {
          console.log(`[remark-abbrlink] 构建环境下不写入，仅生成 abbrlink: ${abbrlink}`);
        }
        
        console.log(`[remark-abbrlink] 为文件 ${relativePath} 生成并设置 abbrlink: ${abbrlink}`);
        
        // 将生成的abbrlink添加到frontmatter
        file.data.astro.frontmatter.abbrlink = abbrlink;
    };
}
