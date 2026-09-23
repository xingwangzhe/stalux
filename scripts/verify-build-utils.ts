const assetReferencePattern = /\/_astro\/[A-Za-z0-9._-]+/gu;

export function findMissingAssetReferences(
    sources: ReadonlyMap<string, string>,
    existingAssets: ReadonlySet<string>,
): string[] {
    const missing = new Set<string>();
    const assets = [...existingAssets];
    for (const [source, contents] of sources) {
        for (const match of contents.matchAll(assetReferencePattern)) {
            const reference = match[0];
            const exists =
                existingAssets.has(reference) ||
                assets.some((asset) => asset.startsWith(`${reference}/`));
            if (!exists) missing.add(`${source} -> ${reference}`);
        }
    }
    return [...missing];
}
