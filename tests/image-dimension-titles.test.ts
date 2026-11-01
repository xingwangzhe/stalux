import { markdownToHtml } from "satteri";
import { describe, expect, it } from "vitest";

import { imageDimensions } from "../src/plugins/image-dimensions";

const render = (markdown: string) =>
    markdownToHtml(markdown, { hastPlugins: [imageDimensions] }).html;

describe("image dimension titles", () => {
    it("turns a WxH title into intrinsic attributes and removes the tooltip title", () => {
        const html = render('![screenshot](https://example.com/a.webp "532x200")');
        expect(html).toContain('width="532"');
        expect(html).toContain('height="200"');
        expect(html).not.toContain("title=");
    });

    it("accepts a multiplication sign and surrounding spaces", () => {
        const html = render('![screenshot](https://example.com/a.webp " 1150 × 439 ")');
        expect(html).toContain('width="1150"');
        expect(html).toContain('height="439"');
    });

    it("leaves ordinary titles and images alone", () => {
        const html = render('![screenshot](https://example.com/a.webp "a caption")');
        expect(html).toContain('title="a caption"');
        expect(html).not.toContain("width=");
        expect(html).not.toContain("height=");
    });
});
