import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

function countWords(text: string): number {
    const segmenter = new Intl.Segmenter("zh", { granularity: "word" });
    return [...segmenter.segment(text)].filter((s) => s.isWordLike).length;
}

function formatReadingTime(words: number, wordsPerMinute: number): string {
    const minutes = Math.ceil(words / wordsPerMinute);
    if (minutes < 1) {
        return "小于 1 分钟";
    }
    return `${minutes} 分钟`;
}

export function remarkPostBody() {
    return function (tree: unknown, { data }: { data: any }) {
        const textOnPage = toString(tree);
        const words = countWords(textOnPage);

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

        data.astro.frontmatter.wordCount = words;
        data.astro.frontmatter.desc = textOnPage.slice(0, 125) + "...";
        data.astro.frontmatter.minutesRead = formatReadingTime(words, 400);

        data.astro.frontmatter.hasKatex = hasKatex;
        data.astro.frontmatter.hasMermaid = hasMermaid;
        data.astro.frontmatter.hasImage = hasImage;
    };
}
