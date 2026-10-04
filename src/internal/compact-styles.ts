import path from "node:path";
import { parse as parseAstro } from "@astrojs/compiler";
import { parseExpression, parse as parseScript } from "@babel/parser";
import { generate, ident, parse, walk } from "css-tree";
import MagicString from "magic-string";
import { parseFragment } from "parse5";
import type { Plugin } from "vite";
import { styleNameIn } from "./style-name-lookup.ts";
import { styleNames } from "./style-names.generated.ts";

type Names = typeof styleNames;

/** Rename parsed CSS tokens, preserving strings, URLs and unrelated third-party names. */
export function compactCss(css: string, names: Names = styleNames, inline = false): string {
    const ast = parse(css, {
        context: inline ? "declarationList" : "stylesheet",
        parseCustomProperty: true,
    });
    walk(ast, function (node) {
        if (node.type === "ClassSelector")
            node.name = styleNameIn(names.classes, ident.decode(node.name)) ?? node.name;
        if (node.type === "Declaration")
            node.property = styleNameIn(names.variables, node.property) ?? node.property;
        if (node.type === "Identifier") {
            node.name =
                styleNameIn(names.variables, node.name) ??
                (this.atrule?.name === "keyframes" ||
                this.declaration?.property === "animation" ||
                this.declaration?.property === "animation-name"
                    ? styleNameIn(names.animations, node.name)
                    : undefined) ??
                node.name;
        }
        if (node.type === "AttributeSelector" && node.name.name === "class" && node.value) {
            if (node.matcher !== "=" && node.matcher !== "~=")
                throw new Error(
                    "Theme class substring selectors must use explicit classes before compaction",
                );
            if (node.value.type === "String")
                node.value.value = compactTokens(node.value.value, names);
            if (node.value.type === "Identifier")
                node.value.name = styleNameIn(names.classes, node.value.name) ?? node.value.name;
        }
    });
    return generate(ast);
}

function compactTokens(value: string, names: Names): string {
    // Selectors have two namespaces: class names are private, data attribute values are stable.
    if (value.includes("[data-")) {
        try {
            const selector = parse(value, { context: "selectorList" });
            walk(selector, (node) => {
                if (node.type === "ClassSelector")
                    node.name = styleNameIn(names.classes, ident.decode(node.name)) ?? node.name;
            });
            return generate(selector);
        } catch {
            // A template quasi may end inside an attribute selector. Its data values stay literal.
            return value;
        }
    }
    return value.replace(
        /--[\w-]+|[a-zA-Z_][\w-]*/gu,
        (name) =>
            styleNameIn(names.classes, name) ??
            styleNameIn(names.variables, name) ??
            styleNameIn(names.animations, name) ??
            name,
    );
}

type Edit = { start: number; end: number; text: string };

/** Parse real markup attributes; leave text and code examples untouched. */
function markupEdits(value: string, names: Names): Edit[] {
    const edits: Edit[] = [];
    const ast = parseFragment(value, { sourceCodeLocationInfo: true });
    function visit(node: typeof ast | (typeof ast.childNodes)[number]) {
        if ("tagName" in node) {
            if (["pre", "code", "script", "style"].includes(node.tagName)) return;
            for (const attr of node.attrs) {
                const loc = node.sourceCodeLocation?.attrs?.[attr.name];
                if (!loc || !["class", "style", "data-toc-active-class"].includes(attr.name))
                    continue;
                const raw = value.slice(loc.startOffset, loc.endOffset);
                const offset = loc.startOffset + raw.indexOf("=") + 1;
                const body = value.slice(offset, loc.endOffset);
                if (attr.name === "style") {
                    const leading = body.match(/^\s*(["'])?/u)?.[0] ?? "";
                    const quote = leading.at(-1);
                    const css = body.slice(
                        leading.length,
                        quote === '"' || quote === "'" ? -1 : undefined,
                    );
                    const cssAst = parse(css, {
                        context: "declarationList",
                        positions: true,
                        parseCustomProperty: true,
                    });
                    walk(cssAst, function (token) {
                        if (!token.loc) return;
                        let next: string | undefined;
                        let end = token.loc.end.offset;
                        if (token.type === "Declaration") {
                            next = styleNameIn(names.variables, token.property);
                            end = token.loc.start.offset + token.property.length;
                        }
                        if (token.type === "Identifier")
                            next =
                                styleNameIn(names.variables, token.name) ??
                                (["animation", "animation-name"].includes(
                                    this.declaration?.property ?? "",
                                )
                                    ? styleNameIn(names.animations, token.name)
                                    : undefined);
                        if (next)
                            edits.push({
                                start: offset + leading.length + token.loc.start.offset,
                                end: offset + leading.length + end,
                                text: next,
                            });
                    });
                } else
                    for (const match of body.matchAll(/[a-zA-Z_][\w-]*/gu)) {
                        const next = styleNameIn(names.classes, match[0]);
                        if (next)
                            edits.push({
                                start: offset + match.index,
                                end: offset + match.index + match[0].length,
                                text: next,
                            });
                    }
            }
        }
        if ("childNodes" in node) for (const child of node.childNodes) visit(child);
    }
    visit(ast);
    return edits;
}

function compactMarkup(value: string, names: Names): string {
    const output = new MagicString(value);
    for (const edit of markupEdits(value, names)) output.overwrite(edit.start, edit.end, edit.text);
    return output.toString();
}

function visitSyntax(
    value: unknown,
    callback: (node: Record<string, unknown>) => boolean | undefined,
): void {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
        for (const entry of value) visitSyntax(entry, callback);
        return;
    }
    const node = value as Record<string, unknown>;
    if (typeof node.type === "string" && callback(node) === false) return;
    for (const [key, child] of Object.entries(node))
        if (key !== "loc" && key !== "extra" && key !== "comments") visitSyntax(child, callback);
}

/** Parse source literals; never rewrite generated bundles or consumer modules. */
export function compactScript(code: string, names: Names = styleNames, expression = false): string {
    const ast = expression
        ? parseExpression(code, { plugins: ["typescript"] })
        : parseScript(code, { sourceType: "module", plugins: ["typescript"] });
    const output = new MagicString(code);
    visitSyntax(ast, (node) => {
        if (
            node.type === "ImportDeclaration" ||
            node.type === "ImportExpression" ||
            node.type === "ExportAllDeclaration"
        )
            return false;
        if (
            node.type === "StringLiteral" &&
            typeof node.value === "string" &&
            typeof node.start === "number" &&
            typeof node.end === "number"
        ) {
            const next = node.value.includes("<")
                ? compactMarkup(node.value, names)
                : compactTokens(node.value, names);
            if (next !== node.value) output.overwrite(node.start, node.end, JSON.stringify(next));
        }
        if (
            node.type === "TemplateLiteral" &&
            typeof node.start === "number" &&
            typeof node.end === "number"
        ) {
            const segments = node.quasis as Array<{
                start: number;
                end: number;
                value: { raw: string };
            }>;
            const bodyStart = node.start + 1;
            const expressions = node.expressions as Array<{ start: number; end: number }>;
            const masked = new MagicString(code.slice(bodyStart, node.end - 1));
            for (const expr of expressions)
                masked.overwrite(
                    expr.start - 2 - bodyStart,
                    expr.end + 1 - bodyStart,
                    "x".repeat(expr.end - expr.start + 3),
                );
            const html = masked.toString();
            if (html.includes("<")) {
                for (const edit of markupEdits(html, names)) {
                    const start = bodyStart + edit.start;
                    const end = bodyStart + edit.end;
                    if (!expressions.some((expr) => start < expr.end + 1 && end > expr.start - 2))
                        output.overwrite(start, end, edit.text);
                }
            } else
                for (const segment of segments) {
                    const next = compactTokens(segment.value.raw, names);
                    if (next !== segment.value.raw)
                        output.overwrite(segment.start, segment.end, next);
                }
        }
    });
    return output.toString();
}

export async function compactAstro(code: string, names: Names = styleNames): Promise<string> {
    const { ast } = await parseAstro(code);
    const output = new MagicString(code);
    const sourceBytes = Buffer.from(code);
    const offsetOf = (offset: number) => sourceBytes.subarray(0, offset).toString("utf8").length;
    function visit(node: typeof ast | (typeof ast.children)[number]) {
        if (node.type === "frontmatter") {
            const start = offsetOf(node.position?.start.offset ?? 0) + 3;
            output.overwrite(start, start + node.value.length, compactScript(node.value, names));
        }
        if ("attributes" in node)
            for (const attr of node.attributes) {
                const byteOffset = attr.position?.start.offset;
                const offset = byteOffset === undefined ? undefined : offsetOf(byteOffset);
                if (offset === undefined || attr.kind === "empty" || attr.kind === "spread")
                    continue;
                const equals = code.indexOf("=", offset + attr.name.length);
                const start = equals + 1 + (code.slice(equals + 1).match(/^\s*/u)?.[0].length ?? 0);
                if (
                    attr.kind === "expression" &&
                    (attr.name === "class" ||
                        attr.name === "class:list" ||
                        attr.name === "style" ||
                        attr.name === "data-toc-active-class")
                ) {
                    const next = compactScript(attr.value, names, true);
                    if (next !== attr.value)
                        output.overwrite(start + 1, start + 1 + attr.value.length, next);
                } else if (
                    attr.kind === "quoted" &&
                    ["class", "style", "data-toc-active-class"].includes(attr.name)
                ) {
                    const next =
                        attr.name === "style"
                            ? compactCss(attr.value, names, true)
                            : compactTokens(attr.value, names);
                    if (next !== attr.value)
                        output.overwrite(
                            start,
                            start + (attr.raw?.length ?? attr.value.length + 2),
                            JSON.stringify(next),
                        );
                }
            }
        if (
            "name" in node &&
            (node.name === "style" || node.name === "script") &&
            "children" in node
        ) {
            for (const child of node.children)
                if (child.type === "text" && child.position?.end) {
                    const next =
                        node.name === "style"
                            ? compactCss(child.value, names)
                            : compactScript(child.value, names);
                    if (next !== child.value)
                        output.overwrite(
                            offsetOf(child.position.start.offset),
                            offsetOf(child.position.end.offset),
                            next,
                        );
                }
            return;
        }
        if ("children" in node) for (const child of node.children) visit(child);
    }
    visit(ast);
    return output.toString();
}

export function compactStylesPlugin(srcDir: string): Plugin {
    const root = path.resolve(srcDir) + path.sep;
    return {
        name: "stalux:compact-styles",
        enforce: "pre",
        transform: {
            order: "pre",
            async handler(code, id) {
                const filename = id.split("?")[0] ?? "";
                if (!filename.startsWith(root)) return;
                const relative = filename.slice(root.length).replaceAll(path.sep, "/");
                if (
                    !/^(?:components|layouts|pages|scripts|utils|styles)\//u.test(relative) ||
                    relative === "utils/style-name.ts" ||
                    relative.endsWith(".md.ts")
                )
                    return;
                let next: string;
                if (id.includes("astro&type=")) return;
                if (filename.endsWith(".astro")) next = await compactAstro(code);
                else if (filename.endsWith(".css")) next = compactCss(code);
                else if (filename.endsWith(".ts")) next = compactScript(code);
                else return;
                return next === code ? undefined : { code: next, map: null };
            },
        },
    };
}
