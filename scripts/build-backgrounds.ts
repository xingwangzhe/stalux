import path from "node:path";
import sharp from "sharp";

// Composite the default dark canvas before encoding: preserving thousands of
// alpha edge values costs far more than the visible dark-on-dark detail.
// Keep original SVGs as source artwork for regenerating the rasters.
const sourceDir = Bun.fileURLToPath(new URL("../src/assets/background/", import.meta.url));
const outputDir = Bun.fileURLToPath(new URL("../public/background/", import.meta.url));
let count = 0;
for (const name of [
    ...new Bun.Glob("*.min.svg").scanSync({ cwd: sourceDir, onlyFiles: true }),
].sort()) {
    if (!/^pattern-\d+\.min\.svg$/u.test(name)) continue;
    const artwork = sharp(path.join(sourceDir, name));
    const metadata = await artwork.metadata();
    await artwork
        // Some vectors have small viewBoxes. Rasterize those at reading-screen
        // density rather than enlarging a tiny bitmap on high-DPI phones.
        .resize({ height: Math.max(metadata.height ?? 2436, 2436) })
        .flatten({ background: "#202020" })
        .webp({ quality: 80, effort: 6 })
        .toFile(path.join(outputDir, name.replace(/\.svg$/u, ".dark.webp")));
    count++;
}
console.log(`Generated ${count} dark background companions.`);
