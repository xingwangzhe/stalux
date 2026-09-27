import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addLocalImageDimensions, readImageDimensions } from "../src/internal/image-dimensions";

describe("image dimensions", () => {
    it("reads PNG and WebP intrinsic sizes", () => {
        const png = Buffer.alloc(24);
        Buffer.from("89504e470d0a1a0a", "hex").copy(png);
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
            const png = Buffer.alloc(24);
            Buffer.from("89504e470d0a1a0a", "hex").copy(png);
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
});
