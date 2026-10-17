import { createAstroRenderer } from "astro-expressive-code";
import { parse } from "parse5";
import { expect, it } from "vitest";
import { createHtmlMutationEmitter } from "../src/internal/html-output";
import {
    codeContainmentPlugin,
    containCodeBlocks,
    containMermaidSvgs,
} from "../src/internal/offscreen-layout";

it("reserves every real Expressive Code row including empty rows and leaves wrapped code natural", async () => {
    const { ec: engine } = await createAstroRenderer({
        ecConfig: { themes: ["dark-plus"], plugins: [codeContainmentPlugin()] },
        astroConfig: {
            root: new URL("../", import.meta.url),
            srcDir: new URL("../src/", import.meta.url),
            base: "/",
        },
    });
    const result = await engine.render({ code: "first\n\nlast", language: "text" });
    const json = JSON.stringify(result.renderedGroupAst);
    expect(json).toContain("data-stalux-offscreen-code");
    expect(json).toContain("calc(3 * 1lh)");
    const { ec: wrapped } = await createAstroRenderer({
        ecConfig: {
            themes: ["dark-plus"],
            defaultProps: { wrap: true },
            plugins: [codeContainmentPlugin()],
        },
        astroConfig: {
            root: new URL("../", import.meta.url),
            srcDir: new URL("../src/", import.meta.url),
            base: "/",
        },
    });
    const wrappedResult = await wrapped.render({ code: "a very long line", language: "text" });
    expect(JSON.stringify(wrappedResult.renderedGroupAst)).not.toContain(
        "data-stalux-offscreen-code",
    );
});

it("respects custom containment and unknown block structures", () => {
    const line = { type: "element", tagName: "div", properties: { className: ["ec-line"] } };
    const code = {
        type: "element",
        tagName: "code",
        properties: { style: "content-visibility: visible" },
        children: [line],
    };
    const pre = { type: "element", tagName: "pre", children: [code] };
    expect(containCodeBlocks(pre)).toBe(0);
    code.properties.style = "";
    code.children = [{ type: "element", tagName: "figure", properties: { className: [] } }];
    expect(containCodeBlocks(pre)).toBe(0);
});

it("uses exact SVG viewBox ratios without touching icons, invalid geometry or inert examples", () => {
    const source =
        '<!doctype html><html><head></head><body><p>keep &amp; prose</p><svg id="satteri-mermaid-one" viewBox="0 0 640 320" style="background-color: transparent"><text>Graph</text></svg><svg id="icon" viewBox="0 0 24 24"></svg><svg id="satteri-mermaid-invalid" viewBox="0 0 0 0"></svg><template><svg id="satteri-mermaid-example" viewBox="0 0 10 20"></svg></template><svg id="satteri-mermaid-custom" viewBox="0 0 10 20" style="content-visibility: visible"></svg></body></html>';
    const document = parse(source, { sourceCodeLocationInfo: true });
    const emit = createHtmlMutationEmitter(source, document);
    expect(containMermaidSvgs(document)).toBe(1);
    const output = emit();
    expect(output).toContain("content-visibility:auto;aspect-ratio:640/320");
    expect(output).toContain("<text>Graph</text>");
    expect(output).toContain("<p>keep &amp; prose</p>");
    expect(output).toContain('<svg id="satteri-mermaid-invalid" viewBox="0 0 0 0"></svg>');
    expect(output).toContain(
        '<template><svg id="satteri-mermaid-example" viewBox="0 0 10 20"></svg></template>',
    );
    expect(containMermaidSvgs(document)).toBe(0);
});
