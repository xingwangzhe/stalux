import { toString } from "mdast-util-to-string";
import { readingTime } from "reading-time-estimator";
import { visit } from "unist-util-visit";

export function remarkPostBody() {
    return function (tree: unknown, { data }: { data: any }) {
        const textOnPage = toString(tree);

        const result = readingTime(textOnPage, {
            wordsPerMinute: 400,
            language: "zh-cn",
        });

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

        data.astro.frontmatter.wordCount = result.words;
        data.astro.frontmatter.desc = textOnPage.slice(0, 125) + "...";
        data.astro.frontmatter.minutesRead = result.text;

        data.astro.frontmatter.hasKatex = hasKatex;
        data.astro.frontmatter.hasMermaid = hasMermaid;
        data.astro.frontmatter.hasImage = hasImage;
    };
}
