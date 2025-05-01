import { statSync, readFileSync } from 'fs';
import { createHash } from 'crypto';

export function remarkModifiedAbbrlink() {
    return function (tree, file) {
        // 获取文件路径
        const filepath = file.history[0];
        
        // 获取文件的创建时间（兼容不同操作系统）
        const stats = statSync(filepath);
        // 优先使用birthtime，如果不可用或为无效日期，则使用mtime
        const fileTime = (stats.birthtime && stats.birthtime.getTime()) || stats.mtime.getTime();
        const timeString = fileTime.toString();
        
        const hash = createHash('sha256')
            .update(filepath + timeString)
            .digest('hex');
        
        // 取前8位作为abbrlink
        const abbrlink = hash.substring(0, 8);
        
        // 将生成的abbrlink添加到frontmatter
        file.data.astro.frontmatter.abbrlink = abbrlink;
    };
}
