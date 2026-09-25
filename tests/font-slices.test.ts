import {
    copyFileSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
    clearPageFontSubsets,
    readLinkedStylesheetText,
    writePageFontSubset,
} from "../src/internal/font-slices";

describe("page-specific font subsets", () => {
    it("subsets all visible body scripts and symbols, excluding metadata and hidden content", async () => {
        const root = mkdtempSync(join(tmpdir(), "stalux-page-font-"));
        const cacheDir = join(root, "cache");
        const outputDir = join(root, "output");
        try {
            mkdirSync(join(outputDir, "_astro"), { recursive: true });
            const pagePath = join(outputDir, "index.html");
            writeFileSync(
                join(outputDir, "_astro", "site.css"),
                'h1::after{content:"✓ — “quotes”"}',
            );
            const html =
                '<!doctype html><html><head><meta name="description" content="描述中文 snippet <body></body>"><style>@font-face{font-family:"LXGW WenKai-hash";src:url("/ascii.woff2");unicode-range:U+0020-007E}@font-face{font-family:"LXGW WenKai-hash";src:url("/large.woff2");unicode-range:U+4E00-9FFF}@font-face{font-family:"LXGW WenKai-hash";src:url("/large-2.woff2");unicode-range:U+5200-52FF}:root{--font-body:"Original Font",system-ui,sans-serif}.agent-home-summary{clip:rect(0,0,0,0);position:absolute;width:1px;height:1px;overflow:hidden}h1::after{content:"— “© ✓"}</style></head><body><button aria-label="属性导航" title="属性提示" placeholder="属性占位"></button><p>Homepage首页性能 ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz café</p><details><summary>折叠标题</summary><p>展开后内容</p></details><div class="agent-home-summary">机器隐藏摘要</div><div hidden>显式隐藏文字</div><div style="display:none">样式隐藏文字</div><!-- 注释文字 --><pre>&lt;body&gt;可见代码内容&lt;/body&gt;</pre><svg><text>可见图中文字</text><title>不可见 SVG 标题</title></svg><script>脚本内容</script><template>模板内容</template><style>.隐藏样式内容{}</style></body></html>';
            const font = readFileSync("src/assets/fonts/LXGWWenKai-Regular.ttf");
            const linkedText = readLinkedStylesheetText(
                '<html><head><link rel="stylesheet" href="/_astro/site.css"></head><body></body></html>',
                pagePath,
                outputDir,
            );
            expect(linkedText).toContain("✓ — “quotes”");
            rmSync(join(outputDir, "_astro"), { recursive: true });
            const first = writePageFontSubset(html, font, cacheDir, "/_astro/fonts/", linkedText);
            const second = writePageFontSubset(html, font, cacheDir, "/_astro/fonts/", linkedText);

            expect(first).toBeDefined();
            expect(second).toBeDefined();
            if (!first || !second) throw new Error("Expected a page CJK subset");
            expect(first.filename).toBe(second.filename);
            expect(first.cacheHit).toBe(false);
            expect(second.cacheHit).toBe(true);
            expect(first.html).toContain("font-display:swap");
            expect(first.html).toContain("font-weight:100 900");
            expect(first.html).toContain("U+0041-005A");
            expect(first.html).toContain("U+0061-007A");
            expect(first.html).toContain("U+9996");
            expect(first.html).toContain("U+6298");
            expect(first.html).toContain("U+5C55");
            expect(first.html).toContain("U+56FE");
            expect(first.html).toContain("U+4EE3");
            expect(first.html).not.toContain("U+63CF");
            expect(first.html).not.toContain("U+5C5E");
            expect(first.html).not.toContain("U+673A");
            expect(first.html).not.toContain("U+663E");
            expect(first.html).not.toContain("U+6CE8");
            expect(first.html).not.toContain("U+4E0D");
            expect(first.html).not.toContain("U+4E00-9FFF");
            const subsetFace =
                first.html.match(
                    /@font-face\{font-family:"LXGW WenKai-Page Subset"[^}]*\}/u,
                )?.[0] ?? "";
            const unicodeRanges = subsetFace.match(/unicode-range:([^}]+)/u)?.[1] ?? "";
            const includes = (char: string) => {
                const point = char.codePointAt(0) as number;
                return unicodeRanges.split(",").some((range) => {
                    const match = range.match(/^U\+([\da-f]+)(?:-([\da-f]+))?$/iu);
                    if (!match) return false;
                    const startValue = match[1];
                    if (!startValue) return false;
                    const start = Number.parseInt(startValue, 16);
                    const end = match[2] ? Number.parseInt(match[2], 16) : start;
                    return point >= start && point <= end;
                });
            };
            for (const char of "Homepage Go café" + "—“©✓首页折叠展开可见图中文字") {
                expect(includes(char), `expected ${char} in page subset unicode-range`).toBe(true);
            }
            for (const char of "描述头属机器隐藏显注释") {
                expect(includes(char), `unexpectedly included hidden character ${char}`).toBe(
                    false,
                );
            }
            expect(unicodeRanges).not.toContain("U+811A");
            expect(unicodeRanges).not.toContain("U+65E0");
            expect(first.html).toContain(
                '--font-body:"LXGW WenKai-Page Subset","Original Font",system-ui,sans-serif',
            );
            expect(first.html).toContain(
                '--font-code:"LXGW WenKai-Page Subset","Original Font",system-ui,sans-serif',
            );
            expect(first.html).toContain(
                'body{font-family:var(--font-body),"Original Font",system-ui,sans-serif}',
            );
            expect(first.html).toContain('src:url("/ascii.woff2");unicode-range:U+0020-007E');
            expect(first.html).not.toContain('src:url("/large.woff2")');
            expect(first.html).not.toContain('src:url("/large-2.woff2")');
            mkdirSync(outputDir, { recursive: true });
            copyFileSync(first.sourcePath, join(outputDir, first.filename));
            const outputFile = join(outputDir, first.filename);
            expect(statSync(outputFile).size).toBeLessThan(500_000);
            clearPageFontSubsets(outputDir, new Set([first.filename]));
            expect(readdirSync(outputDir)).toEqual([first.filename]);
            clearPageFontSubsets(outputDir);
            expect(readdirSync(outputDir)).toHaveLength(0);
            expect(readdirSync(cacheDir)).toContain("manifest.jsonl");
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it("creates a subset for visible Latin-only pages", () => {
        const root = mkdtempSync(join(tmpdir(), "stalux-latin-font-"));
        try {
            const html =
                "<html><head><meta name=description content=metadata></head><body><p>English café — © 2026</p></body></html>";
            const font = readFileSync("src/assets/fonts/LXGWWenKai-Regular.ttf");
            const subset = writePageFontSubset(html, font, join(root, "cache"));
            expect(subset).toBeDefined();
            expect(subset?.html).toContain("U+0045");
            expect(subset?.html).toContain("U+00A9");
            expect(subset?.html).not.toContain("U+006D");
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});
