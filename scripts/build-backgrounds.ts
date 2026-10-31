import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Composite the default dark canvas before encoding: preserving thousands of
// alpha edge values costs far more than the visible dark-on-dark detail.
// Original SVGs remain available for custom canvas colors.
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
        .flatten({ background: "#202020" })
        .webp({ quality: 80, effort: 6 })
        .toFile(path.join(directory, name.replace(/\.svg$/u, ".dark.webp")));
    count++;
}
console.log(`Generated ${count} dark background companions.`);
