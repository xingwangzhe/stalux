import { registerPageLifecycle } from "./page-runtime";

registerPageLifecycle("runtime-counter", () => {
    const container = document.querySelector<HTMLElement>("[data-stalux-buildtime]");
    const counter = document.getElementById("runtime-counter");
    if (!container || !counter) return;
    const start = new Date(container.dataset.staluxBuildtime ?? "");
    const format =
        container.dataset.staluxRuntimeFormat ?? "{days}d {hours}h {minutes}m {seconds}s";
    const update = () => {
        const diffMs = Date.now() - start.getTime();
        if (Number.isNaN(diffMs) || diffMs < 0) return;
        const total = Math.floor(diffMs / 1000);
        counter.textContent = format
            .replace("{days}", String(Math.floor(total / 86400)))
            .replace("{hours}", String(Math.floor((total % 86400) / 3600)))
            .replace("{minutes}", String(Math.floor((total % 3600) / 60)))
            .replace("{seconds}", String(total % 60));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
});
