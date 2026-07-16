/**
 * CJK 友好的字数统计。
 *
 * 逻辑对齐原 word-count 包（lepture/word-count）：
 * - 拉丁/数字/部分字母文字：按词计 1
 * - CJK 等宽字符：按字符数计
 */
const WORD_PATTERN =
    /[a-zA-Z0-9'_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff\u0400-\u04ff]+[a-zA-Z0-9'_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff\u0400-\u04ff-]*|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g;

/** CJK 统一汉字区起始码点（含扩展 A 等前的主区边界判断） */
const CJK_START = 0x4e00;

/**
 * 统计文本字数（尊重中日韩字符）。
 */
export function countWords(text: string): number {
    let count = 0;
    for (const match of text.matchAll(WORD_PATTERN)) {
        const token = match[0];
        count += token.codePointAt(0)! >= CJK_START ? token.length : 1;
    }
    return count;
}

export default countWords;
