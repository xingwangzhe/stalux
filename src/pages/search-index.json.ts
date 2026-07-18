import { create, insertMultiple, save } from "@orama/orama";
import { stopwords as mandarinStopwords } from "@orama/stopwords/mandarin";
import { createTokenizer } from "@orama/tokenizers/mandarin";
import { searchSchema, type SearchDoc } from "@utils/search-schema";
import { getCollection, render } from "astro:content";

export async function GET() {
    const [posts, aboutPages, wordEntries] = await Promise.all([
        getCollection("posts", ({ data }) => !data.draft),
        getCollection("about"),
        getCollection("words", ({ data }) => !data.draft),
    ]);

    const documents: SearchDoc[] = [];

    // 用 render() 拿到 Sätteri 插件写入的 frontmatter（searchText 为 heading+paragraph 纯文本）
    for (const post of posts) {
        const { remarkPluginFrontmatter } = await render(post);
        documents.push({
            id: `post-${post.data.abbrlink}`,
            type: "post",
            title: post.data.title,
            description: post.data.desc,
            content: (remarkPluginFrontmatter?.searchText as string) || post.data.desc || "",
            url: `/posts/${post.data.abbrlink}/`,
            date: post.data.date ?? "",
            tags: post.data.tags ?? [],
        });
    }

    for (const about of aboutPages) {
        documents.push({
            id: `about-${about.id}`,
            type: "about",
            title: about.data.title,
            description: about.data.description,
            content: about.data.description,
            url: "/about/",
            date: "",
            tags: [],
        });
    }

    for (const word of wordEntries) {
        const { remarkPluginFrontmatter } = await render(word);
        documents.push({
            id: `word-${word.id}`,
            type: "word",
            title: word.data.title || word.data.source || "一言",
            description: word.data.source || "",
            content: (remarkPluginFrontmatter?.searchText as string) || word.data.source || "",
            url: word.data.abbrlink ? `/words/#word-${word.data.abbrlink}` : "/words/",
            date: word.data.date ?? "",
            tags: word.data.tags ?? [],
        });
    }

    const db = await create({
        schema: searchSchema,
        components: {
            tokenizer: createTokenizer({
                stopWords: mandarinStopwords,
            }),
        },
    });
    await insertMultiple(db, documents);
    const index = await save(db);

    return new Response(JSON.stringify(index), {
        headers: {
            "Content-Type": "application/json",
        },
    });
}
