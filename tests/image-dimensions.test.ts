import { promises as fs } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { findHtmlImages } from "../src/internal/html-images";
import { addLocalImageDimensions, readImageDimensions } from "../src/internal/image-dimensions";
import { applyHtmlImageLoadingPolicy } from "../src/plugins/feature-flags";

describe("image dimensions", () => {
    it("reads PNG, WebP and leading-SOF JPEG intrinsic sizes", () => {
        const png = Buffer.alloc(33);
        Buffer.from("89504e470d0a1a0a", "hex").copy(png);
        png.writeUInt32BE(13, 8);
        png.write("IHDR", 12);
        png[24] = 8;
        png[25] = 2;
        png.writeUInt32BE(640, 16);
        png.writeUInt32BE(360, 20);
        expect(readImageDimensions(png)).toEqual({ width: 640, height: 360 });

        const webp = Buffer.alloc(30);
        webp.write("RIFF", 0);
        webp.write("WEBP", 8);
        webp.write("VP8X", 12);
        webp.writeUIntLE(639, 24, 3);
        webp.writeUIntLE(359, 27, 3);
        expect(readImageDimensions(webp)).toEqual({ width: 640, height: 360 });

        const jpeg = Buffer.alloc(21);
        jpeg.set([0xff, 0xd8, 0xff, 0xc0]);
        jpeg.writeUInt16BE(17, 4);
        jpeg.writeUInt16BE(360, 7);
        jpeg.writeUInt16BE(640, 9);
        expect(readImageDimensions(jpeg)).toEqual({ width: 640, height: 360 });
    });

    it("adds dimensions to local output images only", async () => {
        const outputDir = await mkdtemp(path.join(os.tmpdir(), "stalux-image-dimensions-"));
        try {
            await mkdir(path.join(outputDir, "images"));
            const png = Buffer.alloc(33);
            Buffer.from("89504e470d0a1a0a", "hex").copy(png);
            png.writeUInt32BE(13, 8);
            png.write("IHDR", 12);
            png[24] = 8;
            png[25] = 2;
            png.writeUInt32BE(640, 16);
            png.writeUInt32BE(360, 20);
            await writeFile(path.join(outputDir, "images", "local.png"), png);

            const html = await addLocalImageDimensions(
                '<img src="/images/local.png"><img src="https://example.com/remote.png">',
                outputDir,
            );
            expect(html).toContain('<img src="/images/local.png" width="640" height="360">');
            expect(html).toContain('<img src="https://example.com/remote.png">');
        } finally {
            await rm(outputDir, { recursive: true, force: true });
        }
    });

    it("combines dimensions and loading policy without changing image semantics", async () => {
        const root = await mkdtemp(path.join(os.tmpdir(), "stalux-combined-images-"));
        try {
            const png = Buffer.alloc(33);
            Buffer.from("89504e470d0a1a0a", "hex").copy(png);
            png.writeUInt32BE(13, 8);
            png.write("IHDR", 12);
            png[24] = 8;
            png[25] = 2;
            png.writeUInt32BE(640, 16);
            png.writeUInt32BE(360, 20);
            await writeFile(path.join(root, "local.png"), png);
            const html =
                '<html><body><section data-pagefind-body><img src="/local.png"><img src="/local.png" width="123" fetchpriority="high"><img src="https://example.com/a.png"><img src="http://["></section><img src="/local.png"></body></html>';
            const expected = applyHtmlImageLoadingPolicy(await addLocalImageDimensions(html, root));
            const combined = await addLocalImageDimensions(html, root, {
                images: findHtmlImages(html),
                loadingPolicy: true,
            });
            const attributes = (value: string) =>
                findHtmlImages(value).map((image) => image.attributes);
            expect(attributes(combined)).toEqual(attributes(expected));
        } finally {
            await rm(root, { recursive: true, force: true });
        }
    });
    it("reads SVG viewBox and AVIF dimensions through image-size", () => {
        expect(
            readImageDimensions(
                Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"/>'),
            ),
        ).toEqual({ width: 320, height: 180 });
        const box = (type: string, data: Buffer) => {
            const header = Buffer.alloc(8);
            header.writeUInt32BE(data.length + 8);
            header.write(type, 4);
            return Buffer.concat([header, data]);
        };
        const dimensions = Buffer.alloc(12);
        dimensions.writeUInt32BE(640, 4);
        dimensions.writeUInt32BE(360, 8);
        const avif = Buffer.concat([
            box("ftyp", Buffer.from("avif\0\0\0\0avif")),
            box(
                "meta",
                Buffer.concat([Buffer.alloc(4), box("iprp", box("ipco", box("ispe", dimensions)))]),
            ),
        ]);
        expect(readImageDimensions(avif)).toEqual({ width: 640, height: 360 });
    });

    it("keeps malformed, unsupported and zero-size inputs non-fatal", () => {
        for (const data of [
            Buffer.alloc(0),
            Buffer.from("not an image"),
            Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0, 17]),
            Buffer.from('<svg width="0" height="0"/>'),
        ]) {
            expect(readImageDimensions(data)).toBeUndefined();
        }
    });

    it("keeps JPEG support when short DRI segments precede SOF", () => {
        const jpeg = Buffer.from([
            0xff, 0xd8, 0xff, 0xdd, 0, 4, 0, 1, 0xff, 0xc0, 0, 17, 8, 0, 10, 0, 20, 3, 1, 0x11, 0,
            2, 0x11, 0, 3, 0x11, 0, 0xff, 0xd9,
        ]);
        expect(readImageDimensions(jpeg)).toEqual({ width: 20, height: 10 });
    });

    it("bounds normal file reads and shares repeated image lookups", async () => {
        const root = await mkdtemp(path.join(os.tmpdir(), "stalux-image-window-"));
        const originalOpen = fs.open;
        const requests: number[] = [];
        const opened: string[] = [];
        const spy = vi.spyOn(fs, "open").mockImplementation(async (...args) => {
            opened.push(String(args[0]));
            const handle = await originalOpen(...args);
            const originalRead = handle.read.bind(handle);
            handle.read = ((...readArgs: unknown[]) => {
                requests.push(Number(readArgs[2]));
                return Reflect.apply(originalRead, handle, readArgs);
            }) as typeof handle.read;
            return handle;
        });
        try {
            const svg = '<svg width="640" height="360"/>';
            await writeFile(path.join(root, "large.svg"), svg + " ".repeat(2 * 1024 * 1024));
            const cache = new Map();
            const output = await addLocalImageDimensions(
                '<img src="/large.svg"><img src="/large.svg"><img src="/missing.svg"><img src="data:image/svg+xml,test"><img src="/%2e%2e%2foutside.svg">',
                root,
                { cache },
            );
            expect(output.match(/width="640" height="360"/g)).toHaveLength(2);
            expect(output).toContain('<img src="/missing.svg">');
            expect(opened.filter((name) => name.endsWith("large.svg"))).toHaveLength(1);
            expect(opened.some((name) => name.endsWith("outside.svg"))).toBe(false);
            expect(requests).toContain(512 * 1024);
            expect(requests.every((length) => length <= 512 * 1024)).toBe(true);
        } finally {
            spy.mockRestore();
            await rm(root, { recursive: true, force: true });
        }
    });

    it("preserves JPEGs whose dimensions occur beyond the library header window", async () => {
        const root = await mkdtemp(path.join(os.tmpdir(), "stalux-jpeg-window-"));
        try {
            const app = Buffer.alloc(65537);
            app.set([0xff, 0xe0, 0xff, 0xff]);
            const sof = Buffer.from([
                0xff, 0xc0, 0, 17, 8, 0, 10, 0, 20, 3, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0, 0xff,
                0xd9,
            ]);
            const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), ...Array(9).fill(app), sof]);
            await writeFile(path.join(root, "long.jpg"), jpeg);
            expect(await addLocalImageDimensions('<img src="/long.jpg">', root)).toContain(
                'width="20" height="10"',
            );
        } finally {
            await rm(root, { recursive: true, force: true });
        }
    });
});
