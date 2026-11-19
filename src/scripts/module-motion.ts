import { registerPageLifecycle } from "./page-runtime";

const SELECTOR =
    '[data-stalux-module="summary"], [data-stalux-module="license"], [data-stalux-module="comments"], [data-stalux-module="sidebar"], [data-stalux-module="post-navigation"]';
const MAX_REGIONS = 12;

/** Bounded secondary cues. Text is visible even without observers or animation. */
export function mountModuleMotion(): (() => void) | undefined {
    if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        typeof IntersectionObserver !== "function"
    )
        return;
    const elements = [...document.querySelectorAll<Element>(SELECTOR)].slice(0, MAX_REGIONS);
    if (!elements.length) return;
    const active = new Set<Element>();
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => {
        for (const element of active) element.removeAttribute("data-stalux-module-entering");
        active.clear();
    };
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                // Element already covers everything used below (closest, animate),
                // so the observer's target needs no assertion.
                const element = entry.target;
                observer.unobserve(element);
                // The router owns a single bounded lead region. Do not layer an
                // observer entry over that motion or make long comments slide.
                if (
                    document.hidden ||
                    motionPreference.matches ||
                    document.documentElement.classList.contains("is-changing") ||
                    document.documentElement.dataset.staluxVtPreset ||
                    // A persisted node kept its identity across the visit; it was
                    // never rebuilt, so re-entering it would be a second cue.
                    element.closest("[data-swup-persist]") ||
                    element.closest("[data-stalux-motion-region]") ||
                    entry.boundingClientRect.height > Math.min(420, window.innerHeight * 0.6)
                )
                    continue;
                element.setAttribute("data-stalux-module-entering", "");
                active.add(element);
            }
        },
        { threshold: 0.08 },
    );
    for (const element of elements) observer.observe(element);
    motionPreference.addEventListener("change", cancel);
    return () => {
        observer.disconnect();
        motionPreference.removeEventListener("change", cancel);
        cancel();
    };
}

registerPageLifecycle("module-motion", mountModuleMotion);
