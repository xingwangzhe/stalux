import { describe, expect, it } from "vitest";
import { formatInTimeZone } from "../src/utils/dayjs";

describe("timezone formatter reuse", () => {
    it("preserves UTC, fractional offsets, DST, invalid dates and invalid zones", () => {
        expect(formatInTimeZone("2026-01-01T00:00:00Z", "UTC")).toBe("2026-01-01T00:00:00+00:00");
        expect(formatInTimeZone("2026-01-01T00:00:00Z", "Asia/Kathmandu")).toBe(
            "2026-01-01T05:45:00+05:45",
        );
        expect(formatInTimeZone("2026-07-01T00:00:00Z", "America/New_York")).toBe(
            "2026-06-30T20:00:00-04:00",
        );
        expect(formatInTimeZone("2026-01-01T00:00:00Z", "America/New_York")).toBe(
            "2025-12-31T19:00:00-05:00",
        );
        for (let index = 0; index < 20; index++)
            formatInTimeZone(1700000000000, `Etc/GMT${index % 2 ? "+" : "-"}${index % 12}`);
        expect(formatInTimeZone("2026-01-01T00:00:00Z", "UTC", "HH:mm XXX")).toBe("00:00 +00:00");
        expect(formatInTimeZone("invalid", "UTC")).toBe("");
        expect(() => formatInTimeZone(1700000000000, "not/a-zone")).toThrow(RangeError);
    });
});
