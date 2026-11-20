import { create, type OramaPlugin, search } from "@orama/orama";
import { pluginPT15 } from "@orama/plugin-pt15";
import { createTokenizer } from "@orama/tokenizers/mandarin";

const dimensions = 512;
const cjkRun = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+/gu;
const technicalWord = /[a-z][a-z0-9]*(?:[+#._-][a-z0-9+#._-]+)*/gu;
const searchableFields = ["title", "description", "keywords", "content"] as const;

export function normalizeSearch(value: string) {
    return value.normalize("NFKC").toLowerCase();
}

export function createSearchIndex(cjk: boolean, plugins: OramaPlugin[] = [pluginPT15()]) {
    const mandarin = createTokenizer();
    return create({
        schema: {
            url: "enum",
            post: "enum",
            language: "enum",
            title: "string",
            description: "string",
            keywords: "string",
            content: "string",
            published: "number",
            publishedDate: "string",
            category: "string",
            tags: "string[]",
            embedding: "vector[512]",
        } as const,
        plugins,
        components: {
            tokenizer: {
                language: cjk ? mandarin.language : "english",
                normalizationCache: new Map(),
                tokenize(raw) {
                    const text = normalizeSearch(raw);
                    const technical = [...text.matchAll(technicalWord)].map(([token]) => token);
                    if (!cjk) return technical;
                    const grams: string[] = [];
                    for (const [run] of text.matchAll(cjkRun)) {
                        const chars = [...run];
                        for (const [index, char] of chars.entries()) {
                            grams.push(char);
                            if (index > 0) grams.push(chars[index - 1] + char);
                        }
                    }
                    return [...new Set([...mandarin.tokenize(text), ...technical, ...grams])];
                },
            },
        },
    });
}

export type SearchIndex = ReturnType<typeof createSearchIndex>;
export interface SearchDocument {
    url: string;
    post: string;
    language: string;
    title: string;
    description: string;
    keywords: string;
    content: string;
    published: number;
    publishedDate?: string;
    category?: string;
    tags?: string[];
}

// Signed feature hashing allows vector retrieval without a model download or remote inference.
export function searchVector(raw: string, cjk: boolean): number[] {
    const text = normalizeSearch(raw);
    const vector = Array<number>(dimensions).fill(0);
    const features = new Set([...text.matchAll(technicalWord)].map(([token]) => token));
    if (cjk) {
        for (const [run] of text.matchAll(cjkRun)) {
            const chars = [...run];
            for (const [index, char] of chars.entries()) {
                features.add(char);
                const previous = chars[index - 1];
                const first = chars[index - 2];
                if (previous !== undefined) features.add(previous + char);
                if (first !== undefined && previous !== undefined)
                    features.add(first + previous + char);
            }
        }
    }
    for (const feature of features) {
        let hash = 2166136261;
        for (const char of feature) hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619);
        const index = hash & (dimensions - 1);
        vector[index] = vector[index]! + (hash & 0x10000 ? 1 : -1);
    }
    return vector;
}

export function searchInput(raw: string) {
    const quoted = /^"(.+)"$/u.exec(raw.trim());
    const term = normalizeSearch(quoted?.[1] ?? raw).trim();
    return {
        term,
        quoted: Boolean(quoted),
        terms: quoted ? [term] : term.split(/\s+/u).filter(Boolean),
    };
}

export function searchParameters(term: string, language: string, limit: number, post?: string) {
    return {
        term,
        ...(term ? { properties: [...searchableFields] } : {}),
        where: { language: { eq: language }, ...(post ? { post: { eq: post } } : {}) },
        limit,
        boost: { title: 4, description: 2, keywords: 3 },
    };
}

export function selectSearchHits<
    T extends {
        document: Pick<
            SearchDocument,
            "title" | "description" | "keywords" | "content" | "published"
        >;
        score: number;
    },
>(hits: T[], terms: string[]) {
    return hits
        .filter(({ document }) =>
            terms.every((word) =>
                searchableFields.some((field) => normalizeSearch(document[field]).includes(word)),
            ),
        )
        .sort((a, b) => b.document.published - a.document.published || b.score - a.score);
}

export async function searchDocuments(
    database: SearchIndex,
    raw: string,
    options: { cjk: boolean; language: string; limit: number; hybrid?: boolean; post?: string },
) {
    const { term, quoted, terms } = searchInput(raw);
    const params = searchParameters(term, options.language, options.limit, options.post);
    const vector = searchVector(term, options.cjk);
    const response = await (options.hybrid !== false && !quoted && vector.some(Boolean)
        ? search(database, {
              ...params,
              mode: "hybrid",
              vector: { property: "embedding", value: vector },
              similarity: 0.25,
              hybridWeights: { text: 0.85, vector: 0.15 },
          })
        : search(database, params));
    return selectSearchHits(response.hits, terms);
}
