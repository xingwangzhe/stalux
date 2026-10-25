import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Committed lossless raster companions keep complex SVG paths out of the
// navigation paint pipeline. Run explicitly when the original artwork changes.
const directory = fileURLToPath(new URL("../public/background/", import.meta.url));
let count = 0;
for (const name of (await readdir(directory)).sort()) {
    if (!/^pattern-\d+\.min\.svg$/u.test(name)) continue;
    const artwork = sharp(path.join(directory, name));
    const metadata = await artwork.metadata();
    await artwork
        // Some vectors have small viewBoxes. Rasterize those at reading-screen
        // density rather than enlarging a tiny bitmap on high-DPI phones.
        .resize({ height: Math.max(metadata.height ?? 2436, 2436) })
        .webp({ lossless: true, effort: 6 })
        .toFile(path.join(directory, name.replace(/\.svg$/u, ".webp")));
    count++;
}
console.log(`Generated ${count} lossless background companions.`);
