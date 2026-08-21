declare global {
    interface Window {
        __staluxVerCountLoaded?: boolean;
    }
}

function load() {
    if (document.querySelector("script[data-stalux-vercount]")) return;
    window.__staluxVerCountLoaded = true;
    const script = document.createElement("script");
    script.defer = true;
    script.dataset.staluxVercount = "true";
    script.src = "https://events.vercount.one/js";
    document.head.appendChild(script);
}

document.addEventListener("astro:page-load", load);
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", load, { once: true });
else load();
export {};
