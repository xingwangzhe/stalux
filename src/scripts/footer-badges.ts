// The footer sits outside Swup's containers and keeps these details nodes.
for (const element of document.querySelectorAll<HTMLDetailsElement>(".badge-group")) {
    const key = `badge-${element.id}`;
    try {
        const saved = localStorage.getItem(key);
        if (saved !== null) element.open = saved === "open";
    } catch {
        // The native disclosure remains usable when storage is blocked.
    }
    element.addEventListener("toggle", () => {
        try {
            localStorage.setItem(key, element.open ? "open" : "closed");
        } catch {
            // The current disclosure state still belongs to the document.
        }
    });
}
