import { parse } from "parse5";
import { expect, it } from "vitest";
import { createHtmlMutationEmitter } from "../src/internal/html-output";
import { promoteCodeStyles } from "../src/internal/html-styles";

it("prepares EC styles in head while preserving attributes, prose and inert examples", () => {
    const source =
        '<!doctype html><html><head><link rel="stylesheet" href="/base.css"></head><body><p title="a&amp;b">Untouched &amp; prose</p><div class="expressive-code"><link rel="stylesheet" href="/ec.css" crossorigin="anonymous" integrity="sha256-test"><pre>example</pre></div><template><div class="expressive-code"><link rel="stylesheet" href="/example.css"></div></template><noscript><link rel="stylesheet" href="/fallback.css"></noscript><link rel="stylesheet" href="/custom.css"></body></html>';
    const document = parse(source, { sourceCodeLocationInfo: true });
    const emit = createHtmlMutationEmitter(source, document);
    expect(promoteCodeStyles(document)).toBe(1);
    const output = emit();
    expect(output).toContain(
        '<link rel="stylesheet" href="/ec.css" crossorigin="anonymous" integrity="sha256-test"></head>',
    );
    expect(output).toContain(
        '<p title="a&amp;b">Untouched &amp; prose</p><div class="expressive-code"><pre>example</pre>',
    );
    expect(output).toContain('<noscript><link rel="stylesheet" href="/fallback.css"></noscript>');
    expect(output).toContain(
        '<template><div class="expressive-code"><link rel="stylesheet" href="/example.css"></div></template>',
    );
    expect(output).toContain('<link rel="stylesheet" href="/custom.css"></body>');
    expect(promoteCodeStyles(document)).toBe(0);
});
