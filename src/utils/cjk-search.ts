/** Shared by the indexer and browser: keep Unicode normalization identical. */
export const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

export function normalizeSearch(text: string): string {
    return text.normalize("NFKC").toLowerCase().replace(/\s+/gu, " ").trim();
}

export function cjkGrams(text: string): string[] {
    const grams = new Set<string>();
    let previous = "";
    for (const char of normalizeSearch(text)) {
        if (CJK.test(char)) {
            grams.add(char);
            if (previous) grams.add(previous + char);
            previous = char;
        } else previous = "";
    }
    return [...grams];
}

export function gramShard(gram: string): string {
    let hash = 0;
    for (const char of gram) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
    return (hash % 32).toString(16);
}

export interface CjkDocument {
    url: string;
    title: string;
    description: string;
    keywords: string;
    language: string;
    filters: Record<string, string[]>;
    file: string;
}

export interface CjkManifest {
    documents: CjkDocument[];
    shards: Record<string, string>;
}
