/// <reference types="astro/client" />

declare module "*.css";
declare module "@pagefind/component-ui/css";
declare module "@waline/client/style";

declare module "subset-font" {
    interface SubsetFontOptions {
        targetFormat?: "woff" | "woff2" | "sfnt";
        preserveNameIds?: number[];
    }

    export default function subsetFont(
        font: Buffer,
        text: string,
        options?: SubsetFontOptions,
    ): Promise<Buffer>;
}
