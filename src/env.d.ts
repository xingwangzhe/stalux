/// <reference types="astro/client" />

declare module "*.css";
declare module "@pagefind/component-ui/css";
declare module "@waline/client/style";
declare module "virtual:stalux-search-style" {
    const href: string;
    export default href;
}

declare module "virtual:stalux-social-card-paths" {
    const paths: import("./internal/social-card-renderer").SocialCardPaths;
    export default paths;
}

declare module "virtual:stalux-swup-debug" {
    const Debug: (new () => import("swup").Plugin) | null;
    export default Debug;
}
