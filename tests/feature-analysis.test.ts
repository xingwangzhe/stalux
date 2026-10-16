import { describe, expect, it, vi } from "vitest";
import { analyzeFeatureFlags } from "../src/plugins/feature-flags";

describe("AST-only reading statistics", () => {
    it.each([
        ["", false, 0, 0],
        ["你好 world 123 `inline`。", false, 5, 1],
        [
            "# 标题\n\n> 引用 **加粗**\n\n- 第一项\n- second item\n\n| 项目 | value |\n| --- | --- |\n| 测试 | 42 |",
            false,
            17,
            1,
        ],
        [
            '```ts title="code"\nconst answer = 42; // ignore comment\nconsole.log(answer);\n```\n\n$x^2 + y^2$\n\n$$\n\\frac{a}{b} = 1\n$$\n',
            false,
            24,
            1,
        ],
        ['![示例](/image.webp)\n\n<img src="/raw.webp" alt="raw">\n', true, 0, 0],
        ["Cafe\u0301 naïve １２３ 𠀀 👨‍👩‍👧‍👦 English-word", false, 6, 1],
    ] as const)(
        "preserves prose, code, math and image statistics: %s",
        async (body, hasImage, wordCount, readingMinutes) => {
            expect(await analyzeFeatureFlags(body)).toEqual({
                hasImage,
                wordCount,
                readingMinutes,
            });
        },
    );

    it("counts code independently of highlighter language support", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        try {
            expect(
                await analyzeFeatureFlags(
                    '```stalux-unsupported-language title="code"\nlet value = "中文";\n```',
                ),
            ).toEqual({ hasImage: false, wordCount: 5, readingMinutes: 1 });
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });
});
