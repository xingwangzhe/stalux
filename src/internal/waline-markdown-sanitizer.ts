import type { Plugin } from "vite";

const WALINE_SLIM_MODULE = /[/\\]@waline[/\\]client[/\\]dist[/\\]slim\.js(?:\?.*)?$/u;
const PREVIEW_HTML =
    /(class:`wl-preview`[\s\S]{0,10000}?class:`wl-content`,innerHTML:)([\w$]+\.value)/gu;
const SANITIZE_OPTIONS = `{FORBID_TAGS:["form","input","style"],FORBID_ATTR:["autoplay","style"]}`;

/** Sanitize Waline's live Markdown preview before Vue writes it through innerHTML. */
export function walineMarkdownSanitizerPlugin(): Plugin {
    return {
        name: "stalux:waline-markdown-sanitizer",
        enforce: "pre",
        transform(code, id) {
            if (!WALINE_SLIM_MODULE.test(id.split("?")[0] ?? id)) return null;

            let matches = 0;
            const sanitized = code.replace(
                PREVIEW_HTML,
                (_match, prefix: string, value: string) => {
                    matches += 1;
                    return prefix + "DOMPurify.sanitize(" + value + "," + SANITIZE_OPTIONS + ")";
                },
            );

            if (matches !== 1) {
                this.error(
                    `Expected one Waline Markdown preview render site, found ${matches}; refusing to ship an unsanitized client.`,
                );
            }

            return {
                code: `import DOMPurify from "dompurify";\n${sanitized}`,
                map: null,
            };
        },
    };
}
