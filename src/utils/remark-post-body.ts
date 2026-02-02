import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function remarkPostBody() {
    return function (tree: unknown, { data }: { data: any }) {
        const textOnPage = toString(tree);
        const readingTime = getReadingTime(textOnPage);
        // 设置文章描述,阅读时间,字数到 frontmatter
        data.astro.frontmatter.wordCount = textOnPage.length;
        data.astro.frontmatter.desc = textOnPage.slice(0, 125) + "...";
        data.astro.frontmatter.minutesRead = readingTime.text;
    };
}
