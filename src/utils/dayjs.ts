import { TZDate } from "@date-fns/tz";
/**
 * 日期工具 — 基于 date-fns + @date-fns/tz，提供与旧 dayjs 封装兼容的辅助函数
 */
import { format, isValid } from "date-fns";

export { format, isValid };

/**
 * 在指定 IANA 时区中格式化日期（替代 date-fns-tz 的 formatInTimeZone）
 */
export function formatInTimeZone(
    date: Date | string | number,
    timeZone: string,
    formatStr: string,
): string {
    return format(new TZDate(date, timeZone), formatStr);
}

/** 解析日期字符串，返回 Date 对象 */
export const parseDate = (v: unknown): Date => {
    if (v == null || v === 0 || v === "") return new Date(0);
    const d = new Date(v as string | number | Date);
    return isNaN(d.getTime()) ? new Date(0) : d;
};

/** 获取时间戳（用于排序比较） */
export const toTimestamp = (v: unknown): number => parseDate(v).getTime();
