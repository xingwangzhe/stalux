import { describe, expect, it } from "vitest";
import {
    formatInTimeZone,
    parseDate,
    parseDateInZone,
    toTimestamp,
    zonedCalendarParts,
} from "../src/utils/dayjs";
import { toMachineDateTime } from "../src/utils/semantic-time";

/**
 * 时区回归（2026-10-24 事故）：
 * 无时区的 frontmatter 日期串曾被 new Date() 按构建机器本地时区解析，
 * UTC 构建机（EdgeOne CI）导致 RSS pubDate、页面 datetime、JSON-LD 全体 +8h。
 * 本文件所有期望值都用 Date.UTC 表达，与运行测试的机器时区无关。
 */
describe("timezone-aware date parsing", () => {
    it("parses naive datetimes in the site timezone, not the machine timezone", () => {
        // 1024 文的真实案例：墙钟 12:55 在东八区必须等于 04:55Z
        expect(toTimestamp("2026-10-24 12:55:00", "Asia/Shanghai")).toBe(
            Date.UTC(2026, 9, 24, 4, 55, 0),
        );
        expect(toTimestamp("2026-10-24 12:55:00", "UTC")).toBe(Date.UTC(2026, 9, 24, 12, 55, 0));
        // 跨年边界：北京 2026-01-01 00:30 = 2025-12-31T16:30Z
        expect(toTimestamp("2026-01-01 00:30:00", "Asia/Shanghai")).toBe(
            Date.UTC(2025, 11, 31, 16, 30, 0),
        );
    });

    it("keeps date-only, no-seconds and fractional-second naive forms working", () => {
        expect(toTimestamp("2026-10-24", "Asia/Shanghai")).toBe(Date.UTC(2026, 9, 23, 16, 0, 0));
        expect(toTimestamp("2026-10-24T12:55", "Asia/Shanghai")).toBe(
            Date.UTC(2026, 9, 24, 4, 55, 0),
        );
        expect(toTimestamp("2026-10-24 12:55:00.500", "Asia/Shanghai")).toBe(
            Date.UTC(2026, 9, 24, 4, 55, 0, 500),
        );
    });

    it("respects DST when parsing naive datetimes in zoned sites", () => {
        expect(toTimestamp("2026-07-01 12:00:00", "America/New_York")).toBe(
            Date.UTC(2026, 6, 1, 16, 0, 0),
        );
        expect(toTimestamp("2026-01-15 12:00:00", "America/New_York")).toBe(
            Date.UTC(2026, 0, 15, 17, 0, 0),
        );
    });

    it("leaves explicit-offset strings and non-string values untouched", () => {
        expect(toTimestamp("2026-10-24T12:55:00+08:00", "UTC")).toBe(
            Date.UTC(2026, 9, 24, 4, 55, 0),
        );
        expect(toTimestamp("2026-10-24T12:55:00Z", "Asia/Shanghai")).toBe(
            Date.UTC(2026, 9, 24, 12, 55, 0),
        );
        const date = new Date(Date.UTC(2026, 9, 24, 4, 55, 0));
        expect(parseDate(date, "UTC").getTime()).toBe(date.getTime());
        expect(toTimestamp(0, "Asia/Shanghai")).toBe(0);
        expect(toTimestamp("", "Asia/Shanghai")).toBe(0);
        expect(toTimestamp("invalid", "Asia/Shanghai")).toBe(0);
    });

    it("exposes the single-zone parser and rejects unknown shapes to epoch 0", () => {
        expect(parseDateInZone("2026-10-24 12:55:00", "Asia/Shanghai").getTime()).toBe(
            Date.UTC(2026, 9, 24, 4, 55, 0),
        );
        expect(parseDateInZone("not a date", "Asia/Shanghai").getTime()).toBe(0);
    });
});

describe("zoned calendar grouping (archives)", () => {
    it("groups by the site timezone calendar, not UTC", () => {
        // 北京 2026-01-01 00:30 在 UTC 日历里是 2025-12-31——归档必须仍归入 2026 年 1 月
        const date = parseDate("2026-01-01 00:30:00", "Asia/Shanghai");
        expect(zonedCalendarParts(date, "Asia/Shanghai")).toEqual({
            year: 2026,
            month: 1,
            day: 1,
        });
        expect(zonedCalendarParts(date, "UTC")).toEqual({ year: 2025, month: 12, day: 31 });
    });
});

describe("feed / page / api time surface consistency", () => {
    it("round-trips naive frontmatter through toMachineDateTime into identical instants", () => {
        const naive = "2026-10-24 12:55:00";
        const machine = toMachineDateTime(naive, "Asia/Shanghai");
        expect(machine).toBe("2026-10-24T12:55:00+08:00");
        // @astrojs/rss 会对 Date 调 toUTCString()：同一台机器上无论 TZ 如何都必须得到 04:55Z
        expect(new Date(machine).toUTCString()).toBe("Sat, 24 Oct 2026 04:55:00 GMT");
        expect(new Date(machine).getTime()).toBe(parseDate(naive, "Asia/Shanghai").getTime());
    });

    it("formats the zoned parse back to the same wall clock in any target zone", () => {
        expect(
            formatInTimeZone(parseDate("2026-10-24 12:55:00", "Asia/Shanghai"), "UTC", "HH:mm XXX"),
        ).toBe("04:55 +00:00");
    });
});
