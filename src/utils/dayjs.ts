/**
 * 日期工具 — 纯原生 Date + Intl，无 date-fns 依赖。
 * 保留旧 dayjs 封装导出名，方便现有调用方继续使用。
 */

/** 解析日期字符串，返回 Date 对象 */
export const parseDate = (v: unknown): Date => {
    if (v == null || v === 0 || v === "") return new Date(0);
    const d = new Date(v as string | number | Date);
    return Number.isNaN(d.getTime()) ? new Date(0) : d;
};

/** 是否为有效日期 */
export const isValid = (d: Date): boolean => !Number.isNaN(d.getTime());

/** 获取时间戳（用于排序比较） */
export const toTimestamp = (v: unknown): number => parseDate(v).getTime();

const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * 轻量 format：仅覆盖本项目实际用到的 token。
 * 支持：yyyy MM dd HH mm ss
 */
export function format(date: Date | string | number, formatStr: string): string {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return "";

    // 本地时区（与原先 date-fns format 默认行为一致）
    // 单次正则替换，避免 replaceAll 链式替换的 token 交叉问题
    const tokens: Record<string, string> = {
        yyyy: String(d.getFullYear()),
        MM: pad2(d.getMonth() + 1),
        dd: pad2(d.getDate()),
        HH: pad2(d.getHours()),
        mm: pad2(d.getMinutes()),
        ss: pad2(d.getSeconds()),
    };
    return formatStr.replace(/yyyy|MM|dd|HH|mm|ss/g, (t) => tokens[t] ?? t);
}

/**
 * 在指定 IANA 时区中格式化为带偏移的 ISO 局部串。
 * 默认输出：yyyy-MM-dd'T'HH:mm:ssXXX（如 2026-03-27T14:30:00+08:00）
 */
export function formatInTimeZone(
    date: Date | string | number,
    timeZone: string,
    formatStr: string = "yyyy-MM-dd'T'HH:mm:ssXXX",
): string {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return "";

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZoneName: "longOffset",
    }).formatToParts(d);

    const get = (type: Intl.DateTimeFormatPartTypes): string =>
        parts.find((p) => p.type === type)?.value ?? "";

    const year = get("year");
    const month = get("month");
    const day = get("day");
    const hour = get("hour");
    const minute = get("minute");
    const second = get("second");

    let offset = get("timeZoneName"); // GMT+08:00 / UTC / GMT
    if (offset === "GMT" || offset === "UTC") {
        offset = "+00:00";
    } else {
        offset = offset.replace(/^GMT/, "").replace(/^UTC/, "");
        if (!offset.startsWith("+") && !offset.startsWith("-")) {
            offset = `+${offset}`;
        }
        const m = offset.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
        if (m) {
            offset = `${m[1]}${m[2].padStart(2, "0")}:${m[3] || "00"}`;
        }
    }

    // 目前调用方只使用这一种 pattern；保留 formatStr 参数以便兼容签名
    if (formatStr === "yyyy-MM-dd'T'HH:mm:ssXXX") {
        return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
    }

    // 回退：按 token 替换（不含 locale 名）
    const tokens: Record<string, string> = {
        yyyy: year,
        MM: month,
        dd: day,
        HH: hour,
        mm: minute,
        ss: second,
        XXX: offset,
    };
    return formatStr.replace(/yyyy|MM|dd|HH|mm|ss|XXX/g, (t) => tokens[t] ?? t);
}
