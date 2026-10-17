/// <reference types="astro/client" />

declare module "*.css";
declare module "@pagefind/component-ui/css";
declare module "@waline/client/style";
declare module "virtual:stalux-search-style" {
    const href: string;
    export default href;
}
