let timer: number | undefined;

function stop() {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
}

function start() {
    stop();
    const el = document.getElementById("countdown");
    const template = el?.dataset.countdownTemplate;
    if (!el || !template) return;
    let seconds = 5;
    timer = window.setInterval(() => {
        seconds -= 1;
        if (seconds <= 0) {
            stop();
            document.querySelector<HTMLAnchorElement>(".home-btn")?.click();
        } else {
            el.textContent = template.replace("{n}", String(seconds));
        }
    }, 1000);
}

document.addEventListener("astro:before-swap", stop);
document.addEventListener("astro:page-load", start);
start();
