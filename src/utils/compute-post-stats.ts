/** Compute word count, description, and feature flags from raw Markdown body. */
import { markdownToMdast } from "satteri";

export interface PostStats {
  wordCount: number;
  minutesRead: string;
  desc: string;
  hasKatex: boolean;
  hasMermaid: boolean;
  hasImage: boolean;
}

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

export function computePostStats(body: string): PostStats {
  if (!body) return { wordCount: 0, minutesRead: "< 1 min", desc: "", hasKatex: false, hasMermaid: false, hasImage: false };
  const textParts: string[] = [];
  let hasKatex = false;
  let hasMermaid = false;
  let hasImage = false;
  try {
    const tree = markdownToMdast(body, { features: { math: true, frontmatter: true } });
    walk(tree);
  } catch { /* body might not parse — use defaults */ }
  function walk(node: any) {
    if (!node) return;
    if (node.type === "text" || node.type === "inlineCode" || node.type === "math" || node.type === "inlineMath")
      textParts.push(node.value);
    if (node.type === "math" || node.type === "inlineMath") {
      hasKatex = true;
    }
    if (node.type === "image" || node.type === "imageReference") {
      hasImage = true;
    }
    if (node.type === "code" && node.lang === "mermaid") {
      hasMermaid = true;
    }
    if (node.children) for (const c of node.children) walk(c);
  }
  const plainText = textParts.join(" ");
  const wc = countWords(plainText);
  return { wordCount: wc, minutesRead: formatReadingTime(wc, 400), desc: plainText.slice(0, 125) + (plainText.length > 125 ? "…" : ""), hasKatex, hasMermaid, hasImage };
}
