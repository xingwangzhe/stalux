import { describe, expect, it } from "vitest";
import { PADDED_DATETIME_PATTERN } from "../src/schemas/collections";

/**
 * 日期字段严格格式闸门：月/日/时/分/秒必须补零。
 * 未补零（2026-6-9 9:11:00）无法被站点时区解析器识别，会回退到
 * new Date() 按构建机器本地时区解析（2026-10-24 全站 +8h 事故的残余风险），
 * 因此 schema 层直接拒绝。
 */
describe("PADDED_DATETIME_PATTERN (frontmatter date contract)", () => {
    it("accepts canonical padded forms", () => {
        expect(PADDED_DATETIME_PATTERN.test("2025-07-04 18:44:32")).toBe(true);
        expect(PADDED_DATETIME_PATTERN.test("2026-10-24T12:55:00+08:00")).toBe(true);
        expect(PADDED_DATETIME_PATTERN.test("2025-05-10T12:00:00Z")).toBe(true);
        expect(PADDED_DATETIME_PATTERN.test("2026-10-24T12:55")).toBe(true);
        expect(PADDED_DATETIME_PATTERN.test("2026-10-24")).toBe(true);
        expect(PADDED_DATETIME_PATTERN.test("2026-10-24 12:55:00.500")).toBe(true);
        expect(PADDED_DATETIME_PATTERN.test("2026-10-24 12:55:00+08:00")).toBe(true);
    });

    it("rejects non-padded and malformed values", () => {
        expect(PADDED_DATETIME_PATTERN.test("2026-6-9 9:11:00")).toBe(false);
        expect(PADDED_DATETIME_PATTERN.test("2026-05-19 8:00:00")).toBe(false);
        expect(PADDED_DATETIME_PATTERN.test("2026-6-9")).toBe(false);
        expect(PADDED_DATETIME_PATTERN.test("2026/05/19 08:00:00")).toBe(false);
        expect(PADDED_DATETIME_PATTERN.test("2025-7-4 18:44:32")).toBe(false);
        expect(PADDED_DATETIME_PATTERN.test("")).toBe(false);
        expect(PADDED_DATETIME_PATTERN.test("春秋")).toBe(false);
        expect(PADDED_DATETIME_PATTERN.test("1999")).toBe(false);
    });
});
