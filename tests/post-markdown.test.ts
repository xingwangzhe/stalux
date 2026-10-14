import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";
import { reconstructMarkdown } from "../src/utils/post-markdown";

describe("Markdown export from parsed metadata", () => {
    it.each(["00123", "TRUE", "1e3", 'quote"value', "- hello", "line\nnext", "", "null"])(
        "round-trips the string %j without changing Markdown",
        (value) => {
            const body =
                '```html title="example"\n<style data-stalux-page-font>示例</style>\n```\n\n<!-- preserve -->';
            const output = reconstructMarkdown(
                {
                    title: value,
                    desc: value,
                    date: "2026-10-14 13:00:00",
                    abbrlink: value,
                    tags: [value],
                    categories: [value],
                },
                body,
            );
            const end = output.indexOf("\n---\n", 4);
            const doc = parseDocument(output.slice(4, end));
            expect(doc.errors).toEqual([]);
            expect(doc.toJS()).toMatchObject({
                title: value,
                desc: value,
                abbrlink: value,
                tags: [value],
                categories: [value],
            });
            expect(output.slice(end + 5)).toBe(`${body}\n`);
        },
    );
});
