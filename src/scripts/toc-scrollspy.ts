import { initTocScrollSpy } from "../utils/toc-scrollspy";
import { registerPageLifecycle } from "./page-runtime";

registerPageLifecycle("toc-scrollspy", () => {
    const container = document.querySelector<HTMLElement>("[data-toc-active-class]");
    const activeClass = container?.dataset.tocActiveClass;
    return activeClass ? initTocScrollSpy(activeClass) : undefined;
});
