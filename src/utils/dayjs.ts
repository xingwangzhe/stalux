/**
 * 日期工具 — 纯原生 Date + Intl，无 date-fns 依赖。
 * 保留旧 dayjs 封装导出名，方便现有调用方继续使用。
 */

/**
 * 解析日期字符串，返回 Date 对象。
 * @param v 原始值（Date/时间戳/时间串）
 * @param timeZone 站点 IANA 时区。传入时，不带时区的日期串按该时区挂钟时间解析，
 *   保证任意构建机器（UTC 的 CI、东八区的本机）产出完全一致的时间戳。
 */
export const parseDate = (v: unknown, timeZone?: string): Date => {
    if (v == null || v === 0 || v === "") return new Date(0);
    if (typeof v === "string") {
        const trimmed = v.trim();
        if (timeZone && NAIVE_DATE_PATTERN.test(trimmed)) return parseDateInZone(trimmed, timeZone);
    }
    const d = new Date(v as string | number | Date);
    return Number.isNaN(d.getTime()) ? new Date(0) : d;
};

/** 是否为有效日期 */
export const isValid = (d: Date): boolean => !Number.isNaN(d.getTime());

/** 获取时间戳（用于排序比较） */
export const toTimestamp = (v: unknown, timeZone?: string): number =>
    parseDate(v, timeZone).getTime();

/**
 * 不含时区信息的日期串（frontmatter 里的 "2026-10-24 12:55:00"）。
 * 这类串必须按站点时区解析，绝不能交给 new Date()——它会按
 * **构建机器的本地时区** 解释，EdgeOne/CI 这类 UTC 构建机会让
 * RSS pubDate、页面 datetime 全体平移 8 小时（2026-10-24 事故）。
 */
const NAIVE_DATE_PATTERN =
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;

/** 用共享的 formatter 计算目标时区在给定时刻的 UTC 偏移（毫秒，东八区为 +28800000） */
function zoneOffsetMs(date: Date, timeZone: string): number {
    const parts = getTimezoneFormatter(timeZone).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes): number =>
        Number(parts.find((part) => part.type === type)?.value ?? "0");
    const asUtc = Date.UTC(
        get("year"),
        get("month") - 1,
        get("day"),
        get("hour"),
        get("minute"),
        get("second"),
    );
    return asUtc - date.getTime();
}

/**
 * 把不含时区的日期串按指定 IANA 时区的挂钟时间解析为 Date。
 * 做法是先按 UTC 解释，再用目标时区偏移折算；迭代两次以收敛 DST 边界
 * （南半球夏令时附近的“不存在时间”取近似值，与主流库行为一致）。
 */
export function parseDateInZone(naive: string, timeZone: string): Date {
    const match = naive.trim().match(NAIVE_DATE_PATTERN);
    if (!match) return new Date(0);
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const hour = Number(match[4] ?? 0);
    const minute = Number(match[5] ?? 0);
    const second = Number(match[6] ?? 0);
    const millisecond = Number((match[7] ?? "0").padEnd(3, "0"));
    const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
    let timestamp = wallClockAsUtc;
    for (let iteration = 0; iteration < 2; iteration++) {
        timestamp = wallClockAsUtc - zoneOffsetMs(new Date(timestamp), timeZone);
    }
    return new Date(timestamp);
}

/** 读取目标时区下的日历字段（归档按月分组等场景需要“站点时区的日历”，而非 UTC 日历） */
export function zonedCalendarParts(
    date: Date,
    timeZone: string,
): { year: number; month: number; day: number } {
    const parts = getTimezoneFormatter(timeZone).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes): number =>
        Number(parts.find((part) => part.type === type)?.value ?? "0");
    return { year: get("year"), month: get("month"), day: get("day") };
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

// Bounded across user-supplied zones; invalid zones still throw before caching.
const timezoneFormatters = new Map<string, Intl.DateTimeFormat>();
function getTimezoneFormatter(timeZone: string): Intl.DateTimeFormat {
    let formatter = timezoneFormatters.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
            timeZoneName: "longOffset",
        });
        if (timezoneFormatters.size >= 16) {
            const oldest = timezoneFormatters.keys().next().value;
            if (oldest !== undefined) timezoneFormatters.delete(oldest);
        }
        timezoneFormatters.set(timeZone, formatter);
    }
    return formatter;
}

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

    const parts = getTimezoneFormatter(timeZone).formatToParts(d);

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
        const sign = m?.[1];
        const hours = m?.[2];
        if (sign && hours) {
            offset = `${sign}${hours.padStart(2, "0")}:${m?.[3] || "00"}`;
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
