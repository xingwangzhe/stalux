/// <reference types="astro/client" />
/// <reference types="webmcp-types" />

declare module "*.css";
declare module "@waline/client/style";

declare module "virtual:stalux-swup-debug" {
    const Debug: (new () => import("swup").Plugin) | null;
    export default Debug;
}
