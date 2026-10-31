/** Ownership of formerly global component selectors and shortcuts. */
export function commonStyleOwner(selector: string) {
    if (/stalux-404|agent-recovery/u.test(selector)) return "notFound";
    if (/stalux-home|agent-home-summary|stalux-typewriter/u.test(selector)) return "home";
    if (/stalux-card-post|stalux-post-card|stalux-post-list|stalux-card-read-more/u.test(selector))
        return "cards";
    if (/stalux-author/u.test(selector)) return "author";
    if (/stalux-social/u.test(selector)) return "social";
    return "common";
}
