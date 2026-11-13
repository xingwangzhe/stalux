import { registerPageLifecycle } from "./page-runtime";
import { observeVisibleClock } from "./visible-clock";

const pad2 = (value: number) => String(value).padStart(2, "0");

/** 机器可读值必须与访客本地日历一致，因此按本地时间拼装（toISOString 是 UTC）。 */
function toMachineDate(date: Date): string {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toMachineTime(date: Date): string {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

// Modern Web Guidance (javascript): 本地化日期交给 Intl.DateTimeFormat，
// 按语言缓存 formatter，避免每秒 tick 时重复构造。
const displayFormatters = new Map<string, Intl.DateTimeFormat>();

function toDisplayDate(date: Date, lang: string): string {
    let formatter = displayFormatters.get(lang);
    if (!formatter) {
        const zh = lang.toLowerCase().startsWith("zh");
        formatter = new Intl.DateTimeFormat(lang, {
            year: "numeric",
            month: zh ? "long" : "short",
            day: "2-digit",
        });
        displayFormatters.set(lang, formatter);
    }
    return formatter.format(date);
}

registerPageLifecycle("date-time", () => {
    const dateElement = document.querySelector<HTMLTimeElement>('[data-ref="date"]');
    const timeElement = document.querySelector<HTMLTimeElement>('[data-ref="time"]');
    if (!(dateElement && timeElement)) return;
    const lang = document.documentElement.lang || "zh-CN";
    let lastDate = "";
    const update = () => {
        const now = new Date();
        const time = toMachineTime(now);
        const date = toMachineDate(now);
        if (date !== lastDate) {
            dateElement.textContent = toDisplayDate(now, lang);
            dateElement.dateTime = date;
            lastDate = date;
        }
        timeElement.textContent = time;
        timeElement.dateTime = time;
    };
    return observeVisibleClock(timeElement, update);
});
