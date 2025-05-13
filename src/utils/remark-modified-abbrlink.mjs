import { statSync } from 'fs';
import { createHash } from 'crypto';
import { getFileTimestamp, initFileTimestamp } from './file-timestamps.mjs';

export function remarkModifiedAbbrlink() {
    return function (tree, file) {
        // 获取文件路径
        const filepath = file.history[0];
        
        // 尝试从时间戳文件中获取创建时间
        let timestamp = getFileTimestamp(filepath);
        
        // 如果找不到时间戳数据，初始化它
        if (!timestamp) {
            initFileTimestamp(filepath);
            timestamp = getFileTimestamp(filepath);
        }
        
        let timeString;
        
        if (timestamp) {
            // 使用持久化的创建时间来生成稳定的哈希值
            timeString = new Date(timestamp.created).getTime().toString();
        } else {
            // 作为备选方案，使用文件系统时间
            const stats = statSync(filepath);
            const fileTime = (stats.birthtime && stats.birthtime.getTime()) || stats.mtime.getTime();
            timeString = fileTime.toString();
        }
        
        const hash = createHash('sha256')
            .update(filepath + timeString)
            .digest('hex');
        
        // 取前8位作为abbrlink
        const abbrlink = hash.substring(0, 8);
        
        // 将生成的abbrlink添加到frontmatter
        file.data.astro.frontmatter.abbrlink = abbrlink;
    };
}
