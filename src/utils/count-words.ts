/**
 * CJK 友好的字数统计 — 基于 W3C Intl.Segmenter API（UAX #29 标准分词）。
 *
 * 替代手写 Unicode 正则的方案：
 * - CJK 字符：`Intl.Segmenter` 逐字分割，每个字计 1
 * - 拉丁/数字/其他字母文字：按词计 1
 * - 标点/空白不计
 */
const segmenter = new Intl.Segmenter("zh", { granularity: "word" });

/**
 * 统计文本字数（基于 Intl.Segmenter 分词）。
 */
export function countWords(text: string): number {
    let count = 0;
    for (const { isWordLike } of segmenter.segment(text)) {
        if (isWordLike) count++;
    }
    return count;
}

