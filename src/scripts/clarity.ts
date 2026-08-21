declare global {
    interface Window {
        clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
        __staluxClarityLoaded?: boolean;
    }
}

function load() {
    const id = document.body?.dataset.staluxClarityId;
    if (!id || document.getElementById("stalux-clarity-script")) return;
    window.__staluxClarityLoaded = true;
    window.clarity =
        window.clarity ||
        Object.assign((...args: unknown[]) => window.clarity?.q?.push(args), { q: [] });
    const script = document.createElement("script");
    script.id = "stalux-clarity-script";
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(id)}`;
    document.head.appendChild(script);
}

document.addEventListener("astro:page-load", load);
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", load, { once: true });
else load();
export {};
