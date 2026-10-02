import { readFileSync, renameSync, unlinkSync, watch, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import UnoCSS from "unocss/vite";
import { build as viteBuild } from "vite";
import { componentShortcuts } from "../src/styles/shortcuts.ts";
import unoConfig from "../uno.config.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
function readStyle(filename: string): string {
    return readFileSync(filename, "utf8").replace(
        /@import\s+"(\.[^"]+)";/g,
        (_match, relative: string) => readStyle(path.resolve(path.dirname(filename), relative)),
    );
}
const featurePatterns = {
    archives: /^stalux-(?:archive-|archives-)/,
    article:
        /^stalux-(?:random-|toc-|sidebar|pagination|article$|byline-|license|post-(?!card$|list-))/,
    categories: /^stalux-(?:category|categories)/,
    links: /^stalux-(?:links$|link-)/,
    tags: /^stalux-(?:cloud-|tag-)/,
    words: /^stalux-(?:word-|word-list-)/,
} as const;
async function compile(
    input: string,
    suffix: string,
    utilities: boolean,
    feature?: keyof typeof featurePatterns,
) {
    const output = `${root}src/styles/generated${suffix}.css`;
    const entry = `${root}.styles-entry${suffix}-${process.pid}.ts`;
    const stylesheet = `${root}.styles-entry${suffix}-${process.pid}.css`;
    writeFileSync(stylesheet, readStyle(`${root}src/styles/${input}`));
    writeFileSync(
        entry,
        `${utilities ? 'import "virtual:uno.css";\n' : ""}import ${JSON.stringify(`./.styles-entry${suffix}-${process.pid}.css`)};\n`,
    );
    const previousWarn = console.warn;
    const unresolved: string[] = [];
    console.warn = (...args: unknown[]) => {
        const message = args.map(String).join(" ");
        if (message.includes("[unocss] unmatched utility")) unresolved.push(message);
        previousWarn(...args);
    };
    try {
        const result = await viteBuild({
            root,
            configFile: false,
            logLevel: "warn",
            plugins: [
                UnoCSS({
                    ...unoConfig,
                    configFile: false,
                    ...(feature
                        ? {
                              content: { filesystem: [], pipeline: false },
                              safelist: Object.keys(componentShortcuts).filter((name) =>
                                  featurePatterns[feature].test(name),
                              ),
                          }
                        : utilities
                          ? {
                                blocklist: Object.values(featurePatterns),
                            }
                          : {}),
                }),
            ],
            build: {
                write: false,
                minify: true,
                cssMinify: "lightningcss",
                cssCodeSplit: false,
                rollupOptions: { input: entry },
            },
        });
        const bundles = Array.isArray(result) ? result : [result];
        if (!bundles.every((bundle) => "output" in bundle))
            throw new Error("Unexpected CSS watch result");
        const compiled = bundles
            .flatMap((bundle) => ("output" in bundle ? bundle.output : []))
            .filter((asset) => asset.type === "asset" && asset.fileName.endsWith(".css"))
            .map((asset) => (asset.type === "asset" ? String(asset.source) : ""))
            .join("\n");
        const css = utilities
            ? `@layer theme, base, components, utilities;\n${compiled}`
            : compiled;
        if (unresolved.length) throw new Error(unresolved.join("\n"));
        if (!compiled || /@apply\b/.test(css))
            throw new Error("UnoCSS did not compile all style directives");
        let previous = "";
        try {
            previous = readFileSync(output, "utf8");
        } catch {
            /* First compilation. */
        }
        if (previous !== css) {
            const temporary = `${output}.tmp-${process.pid}`;
            writeFileSync(temporary, css);
            renameSync(temporary, output);
        }
        console.log(`[styles] UnoCSS generated${suffix}.css: ${Buffer.byteLength(css)} bytes`);
    } finally {
        console.warn = previousWarn;
        unlinkSync(entry);
        unlinkSync(stylesheet);
    }
}
async function compileAll() {
    await compile("theme.css", "", true);
    for (const feature of Object.keys(featurePatterns) as Array<keyof typeof featurePatterns>)
        await compile(`${feature}.css`, `-${feature}`, true, feature);
    await compile("prose.css", "-prose", false);
    await compile("components/posts/waline.css", "-waline", false);
}
await compileAll();
if (process.argv.includes("--watch")) {
    let timer: ReturnType<typeof setTimeout>;
    let running = false;
    let pending = false;
    async function rebuild() {
        if (running) {
            pending = true;
            return;
        }
        running = true;
        try {
            await compileAll();
        } catch (error) {
            console.error(error);
        } finally {
            running = false;
            if (pending) {
                pending = false;
                void rebuild();
            }
        }
    }
    const changed = () => {
        clearTimeout(timer);
        timer = setTimeout(() => void rebuild(), 150);
    };
    watch(`${root}src`, { recursive: true }, (_event, filename) => {
        if (
            !filename ||
            /(?:^|[/\\])generated(?:-|\.)/.test(filename) ||
            !/\.(astro|css|ts)$/.test(filename)
        )
            return;
        changed();
    });
    watch(`${root}uno.config.ts`, changed);
}
