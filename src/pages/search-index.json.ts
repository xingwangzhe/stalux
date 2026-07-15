import { create, insertMultiple, save } from "@orama/orama";
import { stopwords as mandarinStopwords } from "@orama/stopwords/mandarin";
import { createTokenizer } from "@orama/tokenizers/mandarin";
import { searchSchema, type SearchDoc } from "@utils/search-schema";
import { getCollection } from "astro:content";
import removeMarkdown from "remove-markdown";

export async function GET() {
    const [posts, aboutPages, wordEntries] = await Promise.all([
        getCollection("posts", ({ data }) => !data.draft),
        getCollection("about"),
        getCollection("words", ({ data }) => !data.draft),
    ]);

    const documents: SearchDoc[] = [];

    for (const post of posts) {
        const body = typeof post.body === "string" ? post.body : "";
        documents.push({
            id: `post-${post.data.abbrlink}`,
            type: "post",
            title: post.data.title,
            description: post.data.desc,
            content: removeMarkdown(body),
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
        const body = typeof word.body === "string" ? word.body : "";
        documents.push({
            id: `word-${word.id}`,
            type: "word",
            title: word.data.title || word.data.source || "一言",
            description: word.data.source || "",
            content: removeMarkdown(body),
            url: word.data.abbrlink ? `/words/${word.data.abbrlink}/` : "/words/",
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
