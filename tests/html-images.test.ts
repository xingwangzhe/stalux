import { parse, serialize } from "parse5";
import { describe, expect, it } from "vitest";
import { findHtmlImages } from "../src/internal/html-images";
import {
    addLocalImageDimensions,
    updateLocalImageDimensions,
} from "../src/internal/image-dimensions";
import { applyHtmlImageLoadingPolicy } from "../src/plugins/feature-flags";

describe("emitted HTML image processing", () => {
    it("updates the existing AST while preserving scripts and foreign content", async () => {
        const script = "const example = '<img src=\"/fake.png\">';";
        const source = `<html><head></head><body><script>${script}</script><section data-pagefind-body><img src="https://example.com/a.png"><img src="https://example.com/b.png"></section><svg viewBox="0 0 20 10"><text>中文</text></svg><math><mi>α</mi></math></body></html>`;
        const document = parse(source, { sourceCodeLocationInfo: true });
        await updateLocalImageDimensions(findHtmlImages(source, document), "/tmp", {
            loadingPolicy: true,
        });
        const output = serialize(document);
        expect(output).toContain(`<script>${script}</script>`);
        expect(output).toContain('viewBox="0 0 20 10"');
        expect(output).toContain("<math><mi>α</mi></math>");
        expect(findHtmlImages(output).map((image) => image.attributes.get("loading"))).toEqual([
            "eager",
            "lazy",
        ]);
    });
    it("leaves copied HTML, scripts and comments untouched", async () => {
        const code = '<button data-code="<img src=&quot;/fake.png&quot;>" title="copy"></button>';
        const script = "<script>const example = '<img src=\"/fake.png\">';</script>";
        const comment = '<!-- <img src="/fake.png"> -->';
        const html = `<section data-pagefind-body>${code}${script}${comment}<img src="https://example.com/real.png"></section>`;
        const output = applyHtmlImageLoadingPolicy(await addLocalImageDimensions(html, "/tmp"));
        expect(output).toContain(code);
        expect(output).toContain(script);
        expect(output).toContain(comment);
        expect(findHtmlImages(output)).toHaveLength(1);
        expect(output).toContain('loading="eager" fetchpriority="high"');
    });

    it("handles nested sections and quoted attribute lookalikes", () => {
        const html =
            '<section data-pagefind-body><section><img src="/a.png" alt=\'loading="keep"\' loading=\'lazy\'></section><img src="/b.png"></section>';
        const output = applyHtmlImageLoadingPolicy(html);
        const images = findHtmlImages(output);
        expect(images.map((image) => image.attributes.get("loading"))).toEqual(["eager", "lazy"]);
        expect(images[0]?.attributes.get("alt")).toBe('loading="keep"');
        expect(output).toContain("alt='loading=\"keep\"'");
    });
});
