/** Compute word count & description from raw Markdown body. Feature flags come from MDAST plugin. */
import { markdownToMdast } from "satteri";

export interface PostStats {
  wordCount: number;
  minutesRead: string;
  desc: string;
}

export function computePostStats(body: string): PostStats {
  if (!body) return { wordCount: 0, minutesRead: "< 1 min", desc: "" };
  const textParts: string[] = [];
  try {
    const tree = markdownToMdast(body, { features: { math: true, frontmatter: true } });
    walk(tree);
  } catch { /* body might not parse — use defaults */ }
  function walk(node: any) {
    if (!node) return;
    if (node.type === "text" || node.type === "inlineCode" || node.type === "math" || node.type === "inlineMath")
      textParts.push(node.value);
    if (node.children) for (const c of node.children) walk(c);
  }
  const plainText = textParts.join(" ");
  const wc = countWords(plainText);
  return { wordCount: wc, minutesRead: formatReadingTime(wc), desc: plainText.slice(0, 125) + (plainText.length > 125 ? "…" : "") };
}

function countWords(text: string): number {
  if (!text) return 0;
  return [...new Intl.Segmenter("zh", { granularity: "word" }).segment(text)].filter(x => x.isWordLike).length;
}
function formatReadingTime(w: number, wpm = 400): string {
  const m = Math.ceil(w / wpm);
  return m < 1 ? "< 1 min" : String(m) + " min";
}
