import { formatInTimeZone, parseDate } from "@utils/dayjs";

/**
 * 将原始时间字符串转换为机器可读的带时区 ISO 格式
 * @param dateStr - frontmatter 中的原始时间字符串
 * @param timezone - IANA 时区字符串，如 "Asia/Shanghai"
 * @returns 带时区的 ISO 8601 格式字符串
 */
export function toMachineDateTime(dateStr: string, timezone: string): string {
    // 关键：无时区的原始串必须按站点时区解析，不能按构建机器本地时区
    return formatInTimeZone(parseDate(dateStr, timezone), timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}
