import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';

export function remarkReadingTime() {
  return function (tree: Root, file: VFile): void {
    // 类型保护：确保 file.data.astro 和 frontmatter 存在
    if (!file.data.astro?.frontmatter) {
      console.warn('[remark-reading-time] 文件没有 frontmatter');
      return;
    }
    
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    
    // readingTime.text 会以友好的字符串形式给出阅读时间，例如 "3 min read"
    file.data.astro.frontmatter.minutesRead = readingTime.text;
  };
}
