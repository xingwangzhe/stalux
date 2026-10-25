import type Swup from "swup";

declare global {
    interface Window {
        swup?: Swup;
    }
}

/** Programmatic theme navigation uses the same controller as ordinary links. */
export function navigate(href: string): void {
    if (window.swup) window.swup.navigate(href);
    else window.location.assign(href);
}
