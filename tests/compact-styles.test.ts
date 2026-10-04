import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
    compactAstro,
    compactCss,
    compactScript,
    compactStylesPlugin,
} from "../src/internal/compact-styles.ts";
import { styleArtifactProblems } from "../src/internal/style-artifacts.ts";
import { styleNames } from "../src/internal/style-names.generated.ts";

const names = {
    classes: { "stalux-main": "s0", "a-none": "s1", "hover:wide": "s2" },
    variables: { "--space-md": "--s0", "--nav-scale": "--s1" },
    animations: { "stalux-enter": "k0" },
};

describe("production style compaction", () => {
    it("renames CSS tokens, escaped classes, selectors, variables and animation references", () => {
        const result = compactCss(
            '.stalux-main:is(:hover,:focus-visible),.hover\\:wide{--nav-scale:var(--space-md,2px);animation:stalux-enter 1s;content:"stalux-main"}@keyframes stalux-enter{to{opacity:1}}.pswp{color:red}',
            names,
        );
        expect(result).toContain(".s0:is(:hover,:focus-visible),.s2");
        expect(result).toContain("--s1:var(--s0,2px)");
        expect(result).toContain("animation:k0 1s");
        expect(result).toContain("@keyframes k0");
        expect(result).toContain('content:"stalux-main"');
        expect(result).toContain(".pswp");
        expect(compactCss(result, names)).toBe(result);
        expect(() => compactCss('[class*="card"]{color:red}', names)).toThrow("substring");
    });

    it("rewrites source selectors and dynamic template literals without touching imports or markup text", () => {
        const source =
            // biome-ignore lint/suspicious/noTemplateCurlyInString: source fixture preserves interpolation syntax.
            'import x from "./stalux-main"; const selector="main.stalux-main"; const html=`<li class="stalux-main"><a href="${href}" class="a-none">${title}</a><code>stalux-main</code></li>`; el.style.setProperty("--nav-scale", value);';
        expect(
            compactScript("document.querySelector('[data-ref=stalux-main] .stalux-main')", names),
        ).toContain("[data-ref=stalux-main] .s0");
        expect(compactScript('const value="toString"; const other="constructor"', names)).toContain(
            '"toString"',
        );
        const result = compactScript(source, names);
        expect(result).toContain('from "./stalux-main"');
        expect(result).toContain('"main.s0"');
        expect(result).toContain('class="s0"');
        expect(result).toContain('class="s1"');
        // biome-ignore lint/suspicious/noTemplateCurlyInString: assert literal source interpolation.
        expect(result).toContain("${href}");
        // biome-ignore lint/suspicious/noTemplateCurlyInString: assert literal source interpolation.
        expect(result).toContain("${title}");
        expect(result).toContain("<code>stalux-main</code>");
        expect(result).toContain('setProperty("--s1"');
        expect(compactScript(result, names)).toBe(result);
        const inline = compactScript(
            `const html='<i style="--space-md:var(--nav-scale);opacity:1"></i>'`,
            names,
        );
        expect(inline).toContain("--s0:var(--s1)");
    });

    it("preserves Unicode source positions, class:list expressions and user data attributes", async () => {
        const source =
            '---\nconst active = "stalux-main";\n---\n<!-- 中文注释 😀 -->\n<div class="stalux-main user-class" class:list={["a-none", {"stalux-main": ready}]} style={{"--nav-scale": value}} data-ref="stalux-main"><style>.stalux-main{color:red}</style><script>document.querySelector(".stalux-main")</script></div>';
        const result = await compactAstro(source, names);
        expect(result).toContain('class="s0 user-class"');
        expect(result).toContain('["s1", {"s0": ready}]');
        expect(result).toContain('{"--s1": value}');
        expect(result).toContain('data-ref="stalux-main"');
        expect(result).toContain(".s0{color:red}");
        expect(result).toContain('querySelector(".s0")');
        expect(result).toContain("中文注释 😀");
        expect(await compactAstro(result, names)).toBe(result);
    });

    it("checks artifacts without flagging prose, code examples or data selector values", () => {
        expect(
            styleArtifactProblems(
                "page.html",
                '<pre><code class="stalux-main">--tw-rotate</code></pre><p>stalux-main</p>',
            ),
        ).toEqual([]);
        expect(
            styleArtifactProblems(
                "runtime.js",
                'document.querySelector("[data-ref=stalux-nav-list]")',
            ),
        ).toEqual([]);
        expect(styleArtifactProblems("theme.css", ".stalux-main{--tw-rotate:0}")).toContain(
            "Tailwind CSS fingerprint or uncompiled directive",
        );
        expect(styleArtifactProblems("page.html", '<main class="stalux-main"></main>')).toContain(
            "uncompacted HTML class stalux-main",
        );
        expect(
            styleArtifactProblems("runtime.js", 'document.querySelector(".stalux-main")'),
        ).toContain("uncompacted script name stalux-main");
    });

    it("only operates on theme source in production builds", () => {
        const plugin = compactStylesPlugin("/theme/src");
        expect(plugin.name).toBe("stalux:compact-styles");
        expect(plugin.enforce).toBe("pre");
    });

    it("ships a collision-free mapping and compiles all theme components", async () => {
        for (const table of Object.values(styleNames)) {
            expect(new Set(Object.values(table)).size).toBe(Object.keys(table).length);
            expect(Object.keys(table).some((name) => Object.values(table).includes(name))).toBe(
                false,
            );
        }
        expect(styleNames.variables["--font-body"]).toBeUndefined();
        expect(styleNames.variables["--font-code"]).toBeUndefined();
        expect(styleNames.classes.pswp).toBeUndefined();
        const root = path.resolve(import.meta.dirname, "../src");
        const { readdirSync } = await import("node:fs");
        function files(dir: string): string[] {
            return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
                entry.isDirectory()
                    ? files(path.join(dir, entry.name))
                    : [path.join(dir, entry.name)],
            );
        }
        for (const file of ["components", "layouts", "pages"]
            .flatMap((dir) => files(path.join(root, dir)))
            .filter((file) => file.endsWith(".astro"))) {
            const source = readFileSync(file, "utf8");
            const output = await compactAstro(source);
            expect(await compactAstro(output)).toBe(output);
        }
    });
});
