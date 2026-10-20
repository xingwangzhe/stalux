import type {
    TransitionBeforePreparationEvent,
    TransitionBeforeSwapEvent,
} from "astro:transitions/client";
import { prepareRouteMotion } from "./route-motion";

type Stage = "loading" | "prepared" | "swapped" | "loaded" | "complete";
interface Navigation {
    signal: AbortSignal;
    stage: Stage;
    swapped: boolean;
    loaded: boolean;
    animated: boolean;
    progress: number;
    detach: () => void;
}

/** Real milestones with bounded visual easing while waiting; never a download percentage. */
export function installNavigationProgress(): void {
    let active: Navigation | undefined;
    let swapping: Navigation | undefined;
    let trickleTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const element = () => document.querySelector<HTMLElement>("[data-stalux-navigation-progress]");
    const paint = (stage?: Stage, progress = 0) => {
        const bar = element();
        if (!bar) return;
        bar.style.transform = `scaleX(${progress})`;
        if (stage) bar.dataset.stage = stage;
        else delete bar.dataset.stage;
    };
    const clear = () => {
        clearTimeout(trickleTimer);
        trickleTimer = undefined;
        swapping = undefined;
        clearTimeout(hideTimer);
        hideTimer = undefined;
        active?.detach();
        active = undefined;
        paint();
    };
    const advance = (navigation: Navigation, stage: Stage) => {
        if (active !== navigation || navigation.signal.aborted) return;
        navigation.stage = stage;
        const milestones = {
            loading: 0.08,
            prepared: 0.65,
            swapped: 0.85,
            loaded: 0.95,
            complete: 1,
        };
        navigation.progress = Math.max(navigation.progress, milestones[stage]);
        paint(stage, navigation.progress);
    };
    const complete = (navigation: Navigation) => {
        if (
            active !== navigation ||
            navigation.stage === "complete" ||
            !navigation.loaded ||
            !navigation.animated
        )
            return;
        clearTimeout(trickleTimer);
        trickleTimer = undefined;
        advance(navigation, "complete");
        navigation.detach();
        hideTimer = setTimeout(() => {
            if (active === navigation) clear();
        }, 250);
    };

    const trickle = (navigation: Navigation) => {
        if (active !== navigation || navigation.signal.aborted || navigation.stage === "complete")
            return;
        const limits = { loading: 0.6, prepared: 0.8, swapped: 0.92, loaded: 0.98 };
        const limit = limits[navigation.stage];
        navigation.progress += (limit - navigation.progress) * 0.12;
        paint(navigation.stage, navigation.progress);
        trickleTimer = setTimeout(() => trickle(navigation), 500);
    };

    document.addEventListener("astro:before-preparation", (event) => {
        clear();
        const preparation = event as TransitionBeforePreparationEvent;
        if (preparation.signal.aborted || event.defaultPrevented) return;
        const abort = () => {
            if (active === navigation) clear();
        };
        const navigation: Navigation = {
            signal: preparation.signal,
            stage: "loading",
            progress: 0.08,
            swapped: false,
            loaded: false,
            animated: false,
            detach: () => preparation.signal.removeEventListener("abort", abort),
        };
        active = navigation;
        preparation.signal.addEventListener("abort", abort, { once: true });
        paint("loading", navigation.progress);
        trickleTimer = setTimeout(() => trickle(navigation), 500);
        const loader = preparation.loader;
        preparation.loader = async () => {
            try {
                await loader();
                if (preparation.defaultPrevented) abort();
                else advance(navigation, "prepared");
            } catch (error) {
                abort();
                throw error;
            }
        };
        // A later listener may cancel preparation before Astro calls the loader.
        queueMicrotask(() => {
            if (preparation.defaultPrevented) abort();
        });
    });
    document.addEventListener("astro:before-swap", (event) => {
        const swap = event as TransitionBeforeSwapEvent;
        const navigation = active;
        if (!navigation || navigation.signal !== swap.signal || swap.signal.aborted) return;
        swapping = navigation;
        const finished = () => {
            if (active !== navigation || navigation.signal.aborted) return;
            navigation.animated = true;
            complete(navigation);
        };
        // Skipped/rejected animations must not leave a completed navigation stuck.
        void prepareRouteMotion(swap).finished.then(finished);
    });
    document.addEventListener("astro:after-swap", () => {
        if (!active || swapping !== active || active.signal.aborted) return;
        swapping = undefined;
        active.swapped = true;
        advance(active, "swapped");
    });
    document.addEventListener("astro:page-load", () => {
        if (!active?.swapped || active.signal.aborted || active.stage === "complete") return;
        active.loaded = true;
        advance(active, "loaded");
        complete(active);
    });
    window.addEventListener("pagehide", clear);
    window.addEventListener("pageshow", (event) => {
        if (event.persisted) clear();
    });
}
