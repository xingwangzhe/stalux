/**
 * TOC 滚动同步 —— 文章正文滚动时，自动高亮右侧目录中对应的条目，
 * 并将该条目滚动到侧边栏可视区域内。
 */

export function initTocScrollSpy(activeClass: string): (() => void) | undefined {
    const tocLinks = document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]");
    if (tocLinks.length === 0) return;

    // 建立标题 ID → 目录链接元素的映射
    const linkMap = new Map<string, HTMLAnchorElement>();
    for (const link of tocLinks) {
        const id = link.getAttribute("href")?.replace("#", "");
        if (id) linkMap.set(id, link);
    }

    // 按 DOM 顺序解析出文章中的标题元素
    const headings = [...linkMap.keys()]
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    let activeLink: HTMLAnchorElement | null = null;
    let pending = false;
    let frameId = 0;
    let sidebarHovered = false;
    const headingOrder = new Map(headings.map((heading, index) => [heading, index]));
    const visibleHeadings = new Set<HTMLElement>();
    const controller = new AbortController();

    // 鼠标悬停在侧边栏上时跳过自动滚动，避免跟用户手动操作冲突
    const sidebar = tocLinks[0]?.closest<HTMLElement>("[data-toc-active-class]");
    if (sidebar) {
        sidebar.addEventListener(
            "mouseenter",
            () => {
                sidebarHovered = true;
            },
            { signal: controller.signal },
        );
        sidebar.addEventListener(
            "mouseleave",
            () => {
                sidebarHovered = false;
            },
            { signal: controller.signal },
        );
    }

    // 切换当前高亮的目录项，并将该项滚动到侧边栏可视区域内
    const setActive = (link: HTMLAnchorElement | null) => {
        if (activeLink === link) return;
        activeLink?.classList.remove(activeClass);
        activeLink = link;
        if (link && !sidebarHovered) {
            link.classList.add(activeClass);
            // Scroll only the TOC pane. scrollIntoView also scrolls the page,
            // fighting anchor navigation and the reader's wheel/touch input.
            const scrollPane = sidebar?.closest<HTMLElement>("[data-stalux-scroll-pane]");
            if (scrollPane) {
                const item = link.getBoundingClientRect();
                const pane = scrollPane.getBoundingClientRect();
                const delta =
                    item.top < pane.top
                        ? item.top - pane.top
                        : item.bottom > pane.bottom
                          ? item.bottom - pane.bottom
                          : 0;
                if (delta)
                    scrollPane.scrollTo({
                        top: scrollPane.scrollTop + delta,
                        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                            ? "instant"
                            : "smooth",
                    });
            }
        } else if (link) {
            // 用户正在操作侧边栏时只高亮，不自动滚动
            link.classList.add(activeClass);
        }
    };

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                const heading = entry.target as HTMLElement;
                if (entry.isIntersecting) visibleHeadings.add(heading);
                else visibleHeadings.delete(heading);
            }
            // 用 rAF 合并同一帧内的多次回调，避免频繁触发布局计算
            if (pending) return;
            pending = true;
            frameId = requestAnimationFrame(() => {
                frameId = 0;
                pending = false;

                // 找到视口上方 35% 区域内最靠上的标题
                let current: HTMLElement | null = null;
                let currentOrder = headings.length;
                for (const heading of visibleHeadings) {
                    const order = headingOrder.get(heading) ?? headings.length;
                    if (order >= currentOrder) continue;
                    const rect = heading.getBoundingClientRect();
                    if (rect.top < window.innerHeight * 0.35 && rect.bottom > 0) {
                        current = heading;
                        currentOrder = order;
                    }
                }

                // 兜底：滚动到文章底部时，取最后一个仍在视口上方或已经越过顶部的标题
                current ??=
                    headings.findLast((h) => {
                        const rect = h.getBoundingClientRect();
                        return rect.bottom <= window.innerHeight * 0.35 || rect.top < 0;
                    }) ?? null;

                setActive(current ? (linkMap.get(current.id) ?? null) : null);
            });
        },
        {
            rootMargin: "0px 0px -65% 0px",
            threshold: 0,
        },
    );

    for (const h of headings) observer.observe(h);

    // Swup owns anchor scrolling, history and interruption for TOC links too.

    return () => {
        controller.abort();
        observer.disconnect();
        visibleHeadings.clear();
        if (frameId) cancelAnimationFrame(frameId);
        activeLink?.classList.remove(activeClass);
    };
}
