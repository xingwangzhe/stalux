import getReadingTime from "reading-time";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
export function remarkPostBody() {
    return function (tree: unknown, { data }: { data: any }) {
        const textOnPage = toString(tree);
        const readingTime = getReadingTime(textOnPage);

        let hasKatex = false;
        let hasMermaid = false;
        let hasImage = false;

        visit(tree, (node: any) => {
            if (node.type === "image" || node.type === "imageReference") {
                hasImage = true;
            }
            if (node.type === "math" || node.type === "inlineMath") {
                hasKatex = true;
            }
            if (node.type === "code" && node.lang === "mermaid") {
                hasMermaid = true;
                node.type = "html";
                node.value = `<pre class="mermaid">${node.value}</pre>`;
            }
        });

        // 设置文章描述,阅读时间,字数到 frontmatter
        data.astro.frontmatter.wordCount = textOnPage.length;
        data.astro.frontmatter.desc = textOnPage.slice(0, 125) + "...";
        data.astro.frontmatter.minutesRead = readingTime.text;

        data.astro.frontmatter.hasKatex = hasKatex;
        data.astro.frontmatter.hasMermaid = hasMermaid;
        data.astro.frontmatter.hasImage = hasImage;
    };
}
