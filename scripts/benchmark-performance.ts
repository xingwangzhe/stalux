/** Run source microbenchmarks against an unchanged baseline or candidate checkout. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "vite";

const root = path.resolve(process.argv[2] ?? ".");
const output = process.argv[3];
const only = process.argv[4];
const server = await createServer({
    root,
    configFile: false,
    server: { middlewareMode: true },
    plugins: [
        {
            name: "benchmark-content-stub",
            resolveId(id) {
                if (id === "astro:content") return "\0benchmark-content";
            },
            load(id) {
                if (id === "\0benchmark-content")
                    return "export const getCollection = async () => [];";
            },
        },
    ],
});
const results: Array<{
    name: string;
    size: number;
    medianMs: number;
    minMs: number;
    maxMs: number;
    rssBytes: number;
    heapUsedBytes: number;
}> = [];
async function measure(name: string, size: number, run: () => unknown) {
    if (only && !name.includes(only)) return;
    for (let warm = 0; warm < 5; warm++) {
        await run();
    }
    const samples: number[] = [];
    for (let repeat = 0; repeat < 15; repeat++) {
        const start = performance.now();
        await run();
        samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    results.push({
        name,
        size,
        medianMs: samples[7] ?? 0,
        minMs: samples[0] ?? 0,
        maxMs: samples.at(-1) ?? 0,
        rssBytes: process.memoryUsage().rss,
        heapUsedBytes: process.memoryUsage().heapUsed,
    });
    console.error(`${name} (${size}): ${samples[7]?.toFixed(3)}ms median`);
}
let disposeCompiler: (() => void) | undefined;
try {
    const { buildPostContentIndex } = await server.ssrLoadModule(
        path.join(root, "src/utils/content-index.ts"),
    );
    const { compactAstro, mapUtf8Offsets } = await server.ssrLoadModule(
        path.join(root, "src/internal/compact-styles.ts"),
    );
    const compilerEntry = createRequire(path.join(root, "package.json")).resolve(
        "@astrojs/compiler",
    );
    const compiler = await import(
        pathToFileURL(path.join(path.dirname(compilerEntry), "index.js")).href
    );
    disposeCompiler = compiler.teardown;
    const { formatInTimeZone } = await server.ssrLoadModule(path.join(root, "src/utils/dayjs.ts"));
    const { writePageFontSubset } = await server.ssrLoadModule(
        path.join(root, "src/internal/font-slices.ts"),
    );
    const font = readFileSync(path.join(root, "src/assets/fonts/LXGWWenKai-Regular.ttf"));
    const cache = path.join(tmpdir(), "stalux-perf-font-benchmark");
    mkdirSync(cache, { recursive: true });
    const lookupPath = path.join(root, "src/utils/post-lookup.ts");
    const lookupModule = existsSync(lookupPath)
        ? await server.ssrLoadModule(lookupPath)
        : undefined;
    for (const size of [1_000, 5_000, 20_000]) {
        const posts = Array.from({ length: size }, (_, index) => ({
            data: {
                abbrlink: String(index),
                date: new Date(Date.UTC(2020, 0, 1 + ((index * 7919) % 2200))).toISOString(),
                updated: new Date(Date.UTC(2026, 0, 1 + (index % 300))).toISOString(),
                tags: [`tag-${index % 23}`, `tag-${index % 7}`],
                categories: [`category-${index % 5}`],
            },
        }));
        await measure("post-index", size, () => buildPostContentIndex(posts));
        const metadata = posts.map((post) => ({
            abbrlink: post.data.abbrlink,
            title: `Title ${post.data.abbrlink}`,
            tags: ["tag"],
        }));
        const lookup = lookupModule?.createPostLookup(metadata);
        const id = String(size - 1);
        await measure("post-id-query", size, () => {
            for (let repeat = 0; repeat < 1000; repeat++) {
                const result = lookup
                    ? lookup.findById(id)
                    : metadata.find((post) => post.abbrlink === id);
                if (!result) throw new Error("Lookup fixture missing");
            }
        });
    }
    for (const size of [1000, 5000, 20000]) {
        const unit = "中文 😀 café\n";
        const source = unit.repeat(size);
        const locations = Array.from(
            { length: size },
            (_, index) => index * Buffer.byteLength(unit),
        );
        const legacy = () => {
            const bytes = Buffer.from(source);
            return new Map(
                locations.map((offset) => [
                    offset,
                    bytes.subarray(0, offset).toString("utf8").length,
                ]),
            );
        };
        await measure("utf8-offsets", size, () =>
            mapUtf8Offsets ? mapUtf8Offsets(source, locations) : legacy(),
        );
    }
    // Larger flat Unicode fixtures exceed the legacy compiler's own WASM heap.
    // Keep supported parser sizes identical for baseline and candidate.
    for (const size of [16, 64, 256]) {
        const source = `---\nconst ready = true;\n---\n${'<p class="stalux-main">中文 😀 café</p>\n'.repeat(size)}`;
        await measure("astro-compaction", size, () => compactAstro(source));
    }
    for (const size of [1000, 4000, 16000]) {
        const html = `<html><head></head><body>${"<p>中文 😀 café 123 内容</p>".repeat(size)}</body></html>`;
        await measure("font-extraction-cached-subset", size, () =>
            writePageFontSubset(html, font, cache),
        );
    }
    for (const size of [1000, 4000, 16000]) {
        const unique = Array.from({ length: size }, (_, index) =>
            String.fromCodePoint(0x4e00 + ((index * 7919) % size)),
        ).join("");
        const html = `<html><head></head><body><p>${unique}</p></body></html>`;
        await measure("font-unique-glyphs-cached-subset", size, () =>
            writePageFontSubset(html, font, cache),
        );
    }
    await measure("timezone-format", 1000, () => {
        for (let index = 0; index < 1000; index++)
            formatInTimeZone(1700000000000 + index * 1000, "Asia/Shanghai");
    });
    const report = { node: process.version, root, rssBytes: process.memoryUsage().rss, results };
    if (output) writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
} finally {
    disposeCompiler?.();
    await server.close();
}
