import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createPageOutputCache } from "../src/internal/page-output-cache";

describe("rendered page output cache", () => {
    it("invalidates only pages that depend on changed assets, including previously missing ones", async () => {
        const root = await mkdtemp(path.join(tmpdir(), "stalux-cache-assets-"));
        try {
            const image = path.join(root, "image.webp");
            const missing = path.join(root, "missing.css");
            await writeFile(image, "first image");
            const directory = path.join(root, "cache");
            const first = await createPageOutputCache(directory, [], undefined, [image]);
            await first.set("dependent.html", "source", { html: "processed" }, [image]);
            await first.set("unrelated.html", "source", { html: "unrelated" });
            await first.set("missing.html", "source", { html: "missing" }, [missing]);
            await writeFile(image, "changed image");
            await writeFile(missing, "newly added stylesheet");
            const next = await createPageOutputCache(directory, [], undefined, [image, missing]);
            expect(await next.get("dependent.html", "source")).toBeUndefined();
            expect(await next.get("missing.html", "source")).toBeUndefined();
            expect(await next.get("unrelated.html", "source")).toEqual({ html: "unrelated" });
        } finally {
            await rm(root, { recursive: true, force: true });
        }
    });
    it("reuses output across builds and invalidates changed HTML, CSS, images, code, or fonts", async () => {
        const root = await mkdtemp(path.join(tmpdir(), "stalux-output-cache-"));
        try {
            const dependencies = ["site.css", "image.webp", "processor.ts"].map((name) =>
                path.join(root, name),
            );
            for (const dependency of dependencies) await writeFile(dependency, "original");
            const directory = path.join(root, "cache");
            const font = Buffer.from("font-one");
            const first = await createPageOutputCache(directory, dependencies, font);
            await first.set("index.html", "source", { html: "processed" });
            const second = await createPageOutputCache(directory, dependencies, font);
            expect(await second.get("index.html", "source")).toEqual({ html: "processed" });
            expect(await second.get("index.html", "edited source")).toBeUndefined();
            expect(await second.get("other/index.html", "source")).toBeUndefined();
            expect(
                await (
                    await createPageOutputCache(directory, dependencies, Buffer.from("font-two"))
                ).get("index.html", "source"),
            ).toBeUndefined();
            for (const dependency of dependencies) {
                await writeFile(dependency, "modified");
                const changed = await createPageOutputCache(directory, dependencies, font);
                expect(await changed.get("index.html", "source")).toBeUndefined();
                await writeFile(dependency, "original");
            }
        } finally {
            await rm(root, { recursive: true, force: true });
        }
    });

    it("rebuilds when a referenced font disappears or an entry is corrupt", async () => {
        const root = await mkdtemp(path.join(tmpdir(), "stalux-output-font-"));
        try {
            const sourcePath = path.join(root, "font.woff2");
            await writeFile(sourcePath, "font");
            const cache = await createPageOutputCache(path.join(root, "cache"), []);
            const output = { html: "processed", font: { filename: "page-abcd.woff2", sourcePath } };
            await cache.set("index.html", "source", output);
            expect(await cache.get("index.html", "source")).toEqual(output);
            await rm(sourcePath);
            expect(await cache.get("index.html", "source")).toBeUndefined();
            await cache.set("index.html", "source", { html: "processed" });
            const files = await (await import("node:fs/promises")).readdir(
                path.join(root, "cache"),
                { recursive: true },
            );
            const entry = files.find((name) => name.endsWith(".json"));
            if (!entry) throw new Error("Cache entry missing");
            const filename = path.join(root, "cache", entry);
            const record = JSON.parse(await readFile(filename, "utf8"));
            record.html = "corrupted";
            await writeFile(filename, JSON.stringify(record));
            expect(await cache.get("index.html", "source")).toBeUndefined();
            await writeFile(filename, "{");
            expect(await cache.get("index.html", "source")).toBeUndefined();
        } finally {
            await rm(root, { recursive: true, force: true });
        }
    });
});
