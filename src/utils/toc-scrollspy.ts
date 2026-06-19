/**
 * TOC 滚动同步 —— 文章正文滚动时，自动高亮右侧目录中对应的条目，
 * 并将该条目滚动到侧边栏可视区域内。
 */

export function initTocScrollSpy(activeClass: string) {
    const tocLinks = document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]");
    if (tocLinks.length === 0) return;

    // 建立标题 ID → 目录链接元素的映射
    const linkMap = new Map<string, HTMLAnchorElement>();
    tocLinks.forEach((link) => {
        const id = link.getAttribute("href")?.replace("#", "");
        if (id) linkMap.set(id, link);
    });

    // 按 DOM 顺序解析出文章中的标题元素
    const headings = [...linkMap.keys()]
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    let activeLink: HTMLAnchorElement | null = null;
    let pending = false;
    let sidebarHovered = false;

    // 鼠标悬停在侧边栏上时跳过自动滚动，避免跟用户手动操作冲突
    const sidebar = tocLinks[0]?.closest<HTMLElement>("[data-toc-active-class]");
    if (sidebar) {
        sidebar.addEventListener("mouseenter", () => {
            sidebarHovered = true;
        });
        sidebar.addEventListener("mouseleave", () => {
            sidebarHovered = false;
        });
    }

    // 切换当前高亮的目录项，并将该项滚动到侧边栏可视区域内
    const setActive = (link: HTMLAnchorElement | null) => {
        if (activeLink === link) return;
        activeLink?.classList.remove(activeClass);
        activeLink = link;
        if (link && !sidebarHovered) {
            link.classList.add(activeClass);
            link.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } else if (link) {
            // 用户正在操作侧边栏时只高亮，不自动滚动
            link.classList.add(activeClass);
        }
    };

    const observer = new IntersectionObserver(
        () => {
            // 用 rAF 合并同一帧内的多次回调，避免频繁触发布局计算
            if (pending) return;
            pending = true;
            requestAnimationFrame(() => {
                pending = false;

                // 找到视口上方 35% 区域内最靠上的标题
                let current: HTMLElement | null = null;
                for (const h of headings) {
                    const rect = h.getBoundingClientRect();
                    if (rect.top < window.innerHeight * 0.35 && rect.bottom > 0) {
                        current = h;
                        break;
                    }
                }

                // 兜底：滚动到文章底部时，取最后一个仍在视口上方或已经越过顶部的标题
                if (!current) {
                    for (let i = headings.length - 1; i >= 0; i--) {
                        const rect = headings[i].getBoundingClientRect();
                        if (rect.bottom <= window.innerHeight * 0.35 || rect.top < 0) {
                            current = headings[i];
                            break;
                        }
                    }
                }

                setActive(current ? (linkMap.get(current.id) ?? null) : null);
            });
        },
        {
            rootMargin: "0px 0px -65% 0px",
            threshold: 0,
        },
    );

    headings.forEach((h) => observer.observe(h));

    // 拦截 TOC 锚点点击，替换为平滑滚动
    tocLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const id = link.getAttribute("href")?.replace("#", "");
            const target = id ? document.getElementById(id) : null;
            target?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}
