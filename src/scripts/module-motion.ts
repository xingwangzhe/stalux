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
    const elements = [...document.querySelectorAll<HTMLElement>(SELECTOR)].slice(0, MAX_REGIONS);
    if (!elements.length) return;
    const active = new Set<Animation>();
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => {
        for (const animation of active) animation.cancel();
        active.clear();
    };
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const element = entry.target as HTMLElement;
                observer.unobserve(element);
                // The router owns a single bounded lead region. Do not layer an
                // observer entry over that motion or make long comments slide.
                if (
                    document.hidden ||
                    motionPreference.matches ||
                    document.documentElement.classList.contains("is-changing") ||
                    document.documentElement.dataset.staluxVtPreset ||
                    element.closest("[data-stalux-motion-region]") ||
                    entry.boundingClientRect.height > Math.min(420, window.innerHeight * 0.6) ||
                    typeof element.animate !== "function"
                )
                    continue;
                try {
                    const animation = element.animate(
                        { opacity: [0.88, 1] },
                        {
                            duration: 140,
                            easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
                        },
                    );
                    active.add(animation);
                    const release = () => {
                        active.delete(animation);
                        animation.cancel();
                    };
                    void animation.finished.then(release, release);
                } catch {
                    /* Unsupported effects leave the authored visible state. */
                }
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
