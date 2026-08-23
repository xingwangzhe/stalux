import { registerPageLifecycle } from "./page-runtime";

registerPageLifecycle("footer-badges", () => {
    const controller = new AbortController();
    for (const element of document.querySelectorAll<HTMLDetailsElement>(".badge-group")) {
        const key = `badge-${element.id}`;
        const saved = localStorage.getItem(key);
        element.open = saved
            ? saved === "open"
            : element.getAttribute("data-default-open") === "true";
        element.addEventListener(
            "toggle",
            () => localStorage.setItem(key, element.open ? "open" : "closed"),
            { signal: controller.signal },
        );
    }
    return () => controller.abort();
});
