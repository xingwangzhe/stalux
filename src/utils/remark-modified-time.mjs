import { statSync } from 'fs';
export function remarkModifiedTime() {
    return function (tree, file) {
      const lastfilepath = file.history[0];
      const firstfilepath = file.history[file.history.length - 1];
      const resultfirst = statSync(firstfilepath);
      
      // 使用 ctime 和 birthtime 中较早的时间作为文件创建时间，以提高跨平台兼容性
      // 某些系统 birthtime 可能不可靠或不存在
      const createTime = new Date(Math.min(
        resultfirst.birthtime.getTime(),
        resultfirst.ctime.getTime()
      ));
      file.data.astro.frontmatter.date = createTime.toISOString();
      
      const resultlast = statSync(lastfilepath);
      // 使用mtime作为文件修改时间
      file.data.astro.frontmatter.updated = resultlast.mtime.toISOString();
    };
  }