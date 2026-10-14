/** Resolve a known static resource under Astro's configured deployment base. */
export function sitePath(pathname: string, base = import.meta.env.BASE_URL): string {
    return `${(base || "/").replace(/\/+$/, "")}/${pathname.replace(/^\/+/, "")}`;
}
