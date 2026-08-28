const assetReferencePattern = /\/_astro\/[A-Za-z0-9._-]+/gu;

export function findMissingAssetReferences(sources, existingAssets) {
    const missing = new Set();
    for (const [source, contents] of sources) {
        for (const match of contents.matchAll(assetReferencePattern)) {
            const reference = match[0];
            const exists =
                existingAssets.has(reference) ||
                [...existingAssets].some((asset) => asset.startsWith(`${reference}/`));
            if (!exists) missing.add(`${source} -> ${reference}`);
        }
    }
    return [...missing];
}
