import { parse, walk } from "css-tree";
import { parse as parseHtml } from "parse5";
import { styleNameIn } from "./style-name-lookup.ts";
import { styleNames } from "./style-names.generated.ts";

// Public enthec/webappanalyzer Tailwind CSS rule snapshot, retrieved 2026-10-04.
// t.json SHA-256: aa96b868b7ad19eccd6c1337a59e14f4ff692a5bcb531a7a1021a3cfef7ab1e4
const tailwindMarkers =
    /--tw-[\w-]+|@(?:apply|tailwind)\b|\/\*!\s*tailwindcss\b|(?:cdn\.)?tailwindcss\.(?:com|js)|\/npm\/@tailwindcss\/browser/iu;

/** Check semantic style surfaces, leaving article prose and code examples intact. */
export function styleArtifactProblems(filename: string, source: string): string[] {
    const problems: string[] = [];
    if (filename.endsWith(".css")) {
        if (tailwindMarkers.test(source))
            problems.push("Tailwind CSS fingerprint or uncompiled directive");
        walk(parse(source, { parseCustomProperty: true }), (node) => {
            if (node.type === "ClassSelector" && styleNameIn(styleNames.classes, node.name))
                problems.push(`uncompacted class ${node.name}`);
            if (node.type === "Declaration" && styleNameIn(styleNames.variables, node.property))
                problems.push(`uncompacted variable ${node.property}`);
            if (
                node.type === "Identifier" &&
                (styleNameIn(styleNames.variables, node.name) ||
                    styleNameIn(styleNames.animations, node.name))
            )
                problems.push(`uncompacted CSS reference ${node.name}`);
        });
    } else if (filename.endsWith(".html")) {
        const ast = parseHtml(source);
        function visit(node: typeof ast | (typeof ast.childNodes)[number]) {
            if ("tagName" in node) {
                if (node.tagName === "pre" || node.tagName === "code") return;
                for (const attr of node.attrs) {
                    if (attr.name === "class")
                        for (const name of attr.value.split(/\s+/u)) {
                            if (styleNameIn(styleNames.classes, name))
                                problems.push(`uncompacted HTML class ${name}`);
                        }
                    if (attr.name === "style")
                        for (const match of attr.value.matchAll(/--[\w-]+/gu)) {
                            if (styleNameIn(styleNames.variables, match[0]))
                                problems.push(`uncompacted inline variable ${match[0]}`);
                        }
                    if (
                        (attr.name === "src" || attr.name === "href") &&
                        tailwindMarkers.test(attr.value)
                    )
                        problems.push("Tailwind CDN reference");
                }
                if (
                    node.tagName === "script" &&
                    "childNodes" in node &&
                    !node.attrs.some(
                        (attr) =>
                            attr.name === "type" &&
                            !["module", "text/javascript"].includes(attr.value),
                    )
                ) {
                    for (const child of node.childNodes)
                        if ("value" in child)
                            problems.push(...styleArtifactProblems("inline.js", child.value));
                }
                if (node.tagName === "style" && "childNodes" in node)
                    for (const child of node.childNodes) {
                        if ("value" in child)
                            problems.push(...styleArtifactProblems("inline.css", child.value));
                    }
            }
            if ("childNodes" in node) for (const child of node.childNodes) visit(child);
        }
        visit(ast);
    } else if (filename.endsWith(".js")) {
        if (tailwindMarkers.test(source)) problems.push("Tailwind script fingerprint");
        const styleReferences = source.replace(/\[data-[^\]]+\]/gu, "");
        for (const match of styleReferences.matchAll(/--[\w-]+|[a-zA-Z_][\w-]*/gu)) {
            if (
                styleNameIn(styleNames.classes, match[0]) ||
                styleNameIn(styleNames.variables, match[0]) ||
                styleNameIn(styleNames.animations, match[0])
            )
                problems.push(`uncompacted script name ${match[0]}`);
        }
    } else if (filename.endsWith(".map")) {
        const map = JSON.parse(source) as { sourcesContent?: string[] };
        if (
            map.sourcesContent?.some((content) =>
                /style-names\.generated|stalux-main|--un-/u.test(content),
            )
        )
            problems.push("public sourcemap exposes theme names");
    }
    return [...new Set(problems)];
}
