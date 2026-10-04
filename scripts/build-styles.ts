import { readFileSync, renameSync, unlinkSync, watch, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import UnoCSS from "unocss/vite";
import { build as viteBuild } from "vite";
import { modernCssTargets } from "../src/internal/modern-css.ts";
import {
    featureStateClasses,
    nativeFeatures,
    type StyleFeature,
    styleFeatures,
} from "../src/styles/features.ts";
import { componentShortcuts, shortcutGroups } from "../src/styles/shortcuts.ts";
import unoConfig from "../uno.config.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
function readStyle(filename: string): string {
    return readFileSync(filename, "utf8").replace(
        /@import\s+"(\.[^"]+)";/g,
        (_match, relative: string) => readStyle(path.resolve(path.dirname(filename), relative)),
    );
}
async function compile(
    sources: readonly string[],
    suffix: string,
    utilities: boolean,
    feature?: StyleFeature,
) {
    const output = `${root}src/styles/generated${suffix}.css`;
    const entry = `${root}.styles-entry${suffix}-${process.pid}.ts`;
    const stylesheet = `${root}.styles-entry${suffix}-${process.pid}.css`;
    writeFileSync(
        stylesheet,
        `${suffix === "-waline" ? "" : "@layer theme, base, components, utilities;\n"}${sources.map((input) => readStyle(`${root}src/styles/${input}`)).join("\n")}`,
    );
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
                    ...(feature && feature !== "common"
                        ? {
                              content: { filesystem: [], pipeline: false },
                              safelist: [
                                  ...Object.keys(componentShortcuts).filter(
                                      (name) => shortcutGroups[name] === feature,
                                  ),
                                  ...featureStateClasses(feature),
                              ],
                          }
                        : utilities
                          ? {
                                blocklist: Object.keys(componentShortcuts).filter(
                                    (name) => shortcutGroups[name] !== "common",
                                ),
                                safelist: featureStateClasses("common"),
                            }
                          : {}),
                }),
            ],
            css: { lightningcss: { targets: modernCssTargets } },
            build: {
                cssTarget: "esnext",
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
    for (const [feature, { sources, suffix }] of Object.entries(styleFeatures))
        await compile(sources, suffix, true, feature as StyleFeature);
    for (const { sources, suffix } of nativeFeatures) await compile(sources, suffix, false);
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
