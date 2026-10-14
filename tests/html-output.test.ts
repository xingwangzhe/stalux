import { type DefaultTreeAdapterMap, defaultTreeAdapter, html, parse } from "parse5";
import { describe, expect, it } from "vitest";
import { removePageFontStyles } from "../src/internal/font-slices";
import { findHtmlImages } from "../src/internal/html-images";
import { createHtmlMutationEmitter } from "../src/internal/html-output";

function addStyle(document: DefaultTreeAdapterMap["document"]) {
    const head = document.childNodes
        .flatMap((node) => ("childNodes" in node ? node.childNodes : []))
        .find((node) => "tagName" in node && node.tagName === "head");
    if (!head || !("childNodes" in head)) throw new Error("No head");
    const style = defaultTreeAdapter.createElement("style", html.NS.HTML, [
        { name: "data-stalux-page-font", value: "" },
    ]);
    defaultTreeAdapter.insertText(style, "new-font-css");
    defaultTreeAdapter.appendChild(head, style);
}

describe("AST mutation output", () => {
    it("preserves untouched source and emits changed attributes/styles once", () => {
        const untouched =
            "<DIV data-code='&lt;style data-stalux-page-font&gt;示例&lt;/style&gt;'>中文 &copy;</DIV><script>const s = \"<style data-stalux-page-font>keep</style>\";</script>";
        const source = `<!doctype html><html><head><style data-stalux-page-font>old</style><style>.keep{color:red}</style></head><body>${untouched}<img src="/a.png" loading="lazy"></body></html>`;
        const document = parse(source, { sourceCodeLocationInfo: true });
        const emit = createHtmlMutationEmitter(source, document);
        removePageFontStyles(document);
        const image = findHtmlImages(source, document)[0];
        if (!image) throw new Error("No image");
        const loading = image.node.attrs.find((attribute) => attribute.name === "loading");
        if (loading) loading.value = "eager";
        image.node.attrs.push({ name: "width", value: "20" });
        addStyle(document);
        const head = document.childNodes
            .flatMap((n) => ("childNodes" in n ? n.childNodes : []))
            .find((n) => "tagName" in n && n.tagName === "head");
        if (!head || !("childNodes" in head)) throw new Error("No head");
        defaultTreeAdapter.appendChild(
            head,
            defaultTreeAdapter.createElement("link", html.NS.HTML, [
                { name: "data-stalux-page-font-preload", value: "" },
                { name: "href", value: "/font.woff2" },
            ]),
        );
        const output = emit();
        expect(output).toContain(untouched);
        expect(output).toContain(
            '<style data-stalux-page-font="">new-font-css</style><link data-stalux-page-font-preload="" href="/font.woff2"></head>',
        );
        expect(output).not.toContain("data-stalux-page-font>old");
        expect(output).toContain("<style>.keep{color:red}</style>");
        expect(output).toContain('loading="eager" width="20"');
        expect(output.startsWith("<!doctype html>")).toBe(true);
    });

    it("returns unchanged source when attributes and stylesheet values are unchanged", () => {
        const source =
            "<html><head><style>body{color:red}</style></head><body><img src=a.png><template><img src=ignored.png></template></body></html>";
        const document = parse(source, { sourceCodeLocationInfo: true });
        expect(createHtmlMutationEmitter(source, document)()).toBe(source);
    });

    it("serializes implicit heads safely when a new style has no source insertion point", () => {
        const source = "<body>中文</body>";
        const document = parse(source, { sourceCodeLocationInfo: true });
        const emit = createHtmlMutationEmitter(source, document);
        addStyle(document);
        expect(emit()).toContain(
            '<head><style data-stalux-page-font="">new-font-css</style></head>',
        );
    });
});
