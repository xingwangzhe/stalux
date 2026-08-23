import { registerPageLifecycle } from "./page-runtime";

const pad2 = (value: number) => String(value).padStart(2, "0");

function toMachineDate(date: Date): string {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toMachineTime(date: Date): string {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function toDisplayDate(date: Date, lang: string): string {
    if (lang.startsWith("zh")) {
        return `${date.getFullYear()}年${pad2(date.getMonth() + 1)}月${pad2(date.getDate())}日`;
    }
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    }).format(date);
}

registerPageLifecycle("date-time", () => {
    const dateElement = document.querySelector<HTMLTimeElement>('[data-ref="date"]');
    const timeElement = document.querySelector<HTMLTimeElement>('[data-ref="time"]');
    if (!dateElement || !timeElement) return;
    const lang = document.documentElement.lang || "zh-CN";
    const update = () => {
        const now = new Date();
        const time = toMachineTime(now);
        dateElement.textContent = toDisplayDate(now, lang);
        dateElement.dateTime = toMachineDate(now);
        timeElement.textContent = time;
        timeElement.dateTime = time;
    };
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
});
