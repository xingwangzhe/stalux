import { registerPageLifecycle } from "./page-runtime";

registerPageLifecycle("not-found-countdown", () => {
    const el = document.getElementById("countdown");
    const template = el?.dataset.countdownTemplate;
    if (!el || !template) return;
    let seconds = 5;
    const timer = window.setInterval(() => {
        seconds -= 1;
        if (seconds <= 0) {
            window.clearInterval(timer);
            document.querySelector<HTMLAnchorElement>(".home-btn")?.click();
        } else {
            el.textContent = template.replace("{n}", String(seconds));
        }
    }, 1000);
    return () => window.clearInterval(timer);
});
