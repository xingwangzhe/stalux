import { describe, expect, it } from "vitest";
import { findHtmlImages } from "../src/internal/html-images";
import { addLocalImageDimensions } from "../src/internal/image-dimensions";
import { applyHtmlImageLoadingPolicy } from "../src/plugins/feature-flags";

describe("emitted HTML image processing", () => {
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
