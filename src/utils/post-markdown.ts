import { Document } from "yaml";

interface MarkdownPostData {
    title: string;
    tags?: string[];
    categories?: string[];
    date: string;
    updated?: string;
    desc: string;
    abbrlink: string | number;
    draft?: boolean;
    cc?: string;
    cover?: string;
    "og:image"?: string;
}

/** Serialize the collection's parsed metadata as YAML AST; preserve the original Markdown body. */
export function reconstructMarkdown(data: MarkdownPostData, body = ""): string {
    const frontmatter = new Document({
        title: data.title,
        ...(data.tags?.length ? { tags: data.tags } : {}),
        ...(data.categories?.length ? { categories: data.categories } : {}),
        date: data.date,
        ...(data.updated ? { updated: data.updated } : {}),
        desc: data.desc,
        abbrlink: String(data.abbrlink),
        ...(data.draft ? { draft: true } : {}),
        ...(data.cc && data.cc !== "CC-BY-NC-SA-4.0" ? { cc: data.cc } : {}),
        ...(data.cover ? { cover: data.cover } : {}),
        ...(data["og:image"] ? { "og:image": data["og:image"] } : {}),
    });
    return `---\n${frontmatter.toString({ lineWidth: 0 })}---\n${body}${body.endsWith("\n") ? "" : "\n"}`;
}
