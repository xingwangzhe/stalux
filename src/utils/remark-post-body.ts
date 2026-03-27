import getReadingTime from "reading-time";
import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";

// 自定义统计纯文本，排除 URL，只保留可见内容
function getCleanText(tree: any): string {
    let text = "";
    visit(tree, (node: any) => {
        // 图片：只保留 alt 文本，跳过 URL
        if (node.type === "image" || node.type === "imageReference") {
            if (node.alt) {
                text += node.alt;
            }
            return;
        }
        // 链接：跳过 URL，只保留链接文本（会被子节点处理）
        if (node.type === "link" || node.type === "linkReference") {
            return;
        }
        // 正常添加文本节点
        if (node.value && typeof node.value === "string") {
            text += node.value;
        }
    });
    return text;
}

export function remarkPostBody() {
    return function (tree: unknown, { data }: { data: any }) {
        const textOnPage = getCleanText(tree);
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
