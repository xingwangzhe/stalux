import { photoswipe } from "@xingwangzhe/satteri-photoswipe";
import { markdownToHtml } from "satteri";
import { describe, expect, it } from "vitest";
import { imageCaptions } from "../src/plugins/image-captions";

function render(markdown: string, lightbox = true) {
    return markdownToHtml(markdown, {
        syntaxHighlight: false,
        hastPlugins: [...(lightbox ? [photoswipe()] : []), imageCaptions],
    }).html.trim();
}

describe("image captions", () => {
    it("replaces the image paragraph with a figure while preserving PhotoSwipe and alt", () => {
        expect(render('![图片说明](/image.webp "标题")')).toBe(
            '<figure data-stalux-image=""><a href="/image.webp" class="pswp-gallery-item" aria-label="图片说明"><img src="/image.webp" alt="图片说明" title="标题"></a><figcaption>图片说明</figcaption></figure>',
        );
    });

    it("also supports images without a lightbox and reference-style images", () => {
        expect(render("![说明][image]\n\n[image]: /image.webp", false)).toContain(
            '<img src="/image.webp" alt="说明"><figcaption>说明</figcaption>',
        );
    });

    it.each([
        "![](/image.webp)",
        "![   ](/image.webp)",
        "正文 ![说明](/image.webp)",
        "![一](/a.webp) ![二](/b.webp)",
    ])("leaves empty, inline and multi-image paragraphs unchanged: %s", (markdown) =>
        expect(render(markdown)).not.toContain("<figcaption>"),
    );

    it("escapes caption text instead of interpreting markup", () => {
        expect(render('![a <script> & "quote"](/image.webp)')).toContain(
            '<figcaption>a &lt;script&gt; &amp; "quote"</figcaption>',
        );
    });

    it("preserves existing figures and captions", () => {
        const markdown =
            '<figure><img src="/image.webp" alt="说明"><figcaption>原图注</figcaption></figure>';
        const html = render(markdown);
        expect(html).not.toContain('data-stalux-image=""');
        expect(html.match(/<figcaption>/g)).toHaveLength(1);
    });

    it("preserves Markdown inside raw HTML figures without affecting images outside", () => {
        const html = render(
            "<figure>\n\n![内部](/inside.webp)\n\n<figcaption>已有图注</figcaption>\n</figure>\n\n![外部](/outside.webp)",
        );
        expect(html.match(/data-stalux-image/g)).toHaveLength(1);
        expect(html.match(/<figcaption>/g)).toHaveLength(2);
        expect(html).not.toContain("<figcaption>内部</figcaption>");
        expect(html).toContain("<figcaption>外部</figcaption>");
    });

    it("does not duplicate captions when registered twice", () => {
        const { html } = markdownToHtml("![说明](/image.webp)", {
            hastPlugins: [photoswipe(), imageCaptions, imageCaptions],
        });
        expect(html.match(/<figcaption>/g)).toHaveLength(1);
    });

    it("preserves an explicit image link when used without PhotoSwipe", () => {
        expect(render("[![说明](/image.webp)](https://example.com)", false)).toContain(
            '<a href="https://example.com"><img src="/image.webp" alt="说明"></a><figcaption>说明</figcaption>',
        );
    });
});
