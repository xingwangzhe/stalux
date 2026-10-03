export function normalizeMessages(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
        : [];
}

type Phase = "typing" | "holding" | "deleting" | "waiting";
interface TypewriterFrame {
    text: string;
    state: Phase | "paused" | "reduced";
}

/** Each instance owns one timer, and resumes without replaying elapsed background time. */
export function createTypewriter(messages: string[], render: (frame: TypewriterFrame) => void) {
    const texts = normalizeMessages(messages);
    const segmenter =
        typeof Intl.Segmenter === "function"
            ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
            : undefined;
    const chars = texts.map((text) =>
        segmenter ? Array.from(segmenter.segment(text), (item) => item.segment) : Array.from(text),
    );
    let index = 0;
    let count = 0;
    let phase: Phase = "typing";
    let active = false;
    let started = false;
    let reduced = false;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
    };
    const paint = () => {
        render({
            text:
                reduced || !started
                    ? (texts[index] ?? "")
                    : (chars[index] ?? []).slice(0, count).join(""),
            state: reduced ? "reduced" : active ? phase : "paused",
        });
    };
    const delay = () => {
        if (reduced) return (texts[index] ?? "").length * 100 + 1500 + 500;
        return { typing: 100, holding: 1500, deleting: 33, waiting: 500 }[phase];
    };
    const schedule = () => {
        clear();
        if (!active || disposed || !texts.length) return;
        timer = setTimeout(() => {
            timer = undefined;
            if (reduced) {
                index = (index + 1) % texts.length;
            } else if (phase === "typing") {
                count++;
                if (count === (chars[index] ?? []).length) phase = "holding";
            } else if (phase === "holding") {
                phase = "deleting";
                count--;
                if (count === 0) phase = "waiting";
            } else if (phase === "deleting") {
                count--;
                if (count === 0) phase = "waiting";
            } else {
                index = (index + 1) % texts.length;
                phase = "typing";
                count = 1;
                if (count === (chars[index] ?? []).length) phase = "holding";
            }
            paint();
            schedule();
        }, delay());
    };
    return {
        setActive(value: boolean) {
            if (disposed || !texts.length || active === value) return;
            active = value;
            if (value) started = true;
            paint();
            schedule();
        },
        setReducedMotion(value: boolean) {
            if (disposed || !texts.length || reduced === value) return;
            reduced = value;
            count = 0;
            phase = "typing";
            paint();
            schedule();
        },
        dispose() {
            disposed = true;
            active = false;
            clear();
            paint();
        },
    };
}

export function mountTypewriters() {
    const disposers: Array<() => void> = [];
    for (const element of document.querySelectorAll<HTMLElement>("[data-stalux-typewriter]")) {
        const output = element.querySelector<HTMLElement>("[data-typewriter-text]");
        if (!output) continue;
        let messages: string[];
        try {
            messages = normalizeMessages(JSON.parse(element.dataset.messages ?? "[]"));
        } catch {
            continue;
        }
        if (!messages.length) continue;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const controller = createTypewriter(messages, ({ text, state }) => {
            output.textContent = text;
            element.dataset.typewriterState = state;
        });
        let visible = false;
        const syncVisibility = () => controller.setActive(visible && !document.hidden);
        const syncMotion = () => controller.setReducedMotion(reducedMotion.matches);
        const observer = new IntersectionObserver((entries) => {
            visible = entries.some((entry) => entry.isIntersecting);
            syncVisibility();
        });
        syncMotion();
        observer.observe(element);
        document.addEventListener("visibilitychange", syncVisibility);
        reducedMotion.addEventListener("change", syncMotion);
        disposers.push(() => {
            observer.disconnect();
            document.removeEventListener("visibilitychange", syncVisibility);
            reducedMotion.removeEventListener("change", syncMotion);
            controller.dispose();
        });
    }
    return () => {
        for (const dispose of disposers) dispose();
    };
}
