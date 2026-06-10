/**
 * 日期工具 — 基于 date-fns，提供与旧 dayjs 封装兼容的辅助函数
 */
export { format, isValid, getMonth, getYear } from "date-fns";
export { formatInTimeZone } from "date-fns-tz";

/** 解析日期字符串，返回 Date 对象 */
export const parseDate = (v: unknown): Date => {
    if (v == null || v === 0 || v === "") return new Date(0);
    const d = new Date(v as string | number | Date);
    return isNaN(d.getTime()) ? new Date(0) : d;
};

/** 获取时间戳（用于排序比较） */
export const toTimestamp = (v: unknown): number => parseDate(v).getTime();
