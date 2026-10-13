import { parse } from "parse5";

const assetReferencePattern = /\/_astro\/[A-Za-z0-9._-]+/gu;

/** HTML code examples are not resource references; inspect real attributes and styles/scripts. */
function resourceFragments(source: string, contents: string): string[] {
    if (!source.endsWith(".html")) return [contents];
    const fragments: string[] = [];
    const ast = parse(contents);
    function visit(node: typeof ast | (typeof ast.childNodes)[number]) {
        if ("tagName" in node) {
            for (const attr of node.attrs) {
                if (["src", "href", "srcset", "poster", "style"].includes(attr.name))
                    fragments.push(attr.value);
                if (
                    node.tagName === "meta" &&
                    attr.name === "content" &&
                    node.attrs.some((entry) =>
                        /^(?:og:image|twitter:image|image)$/u.test(entry.value),
                    )
                )
                    fragments.push(attr.value);
            }
            if ((node.tagName === "style" || node.tagName === "script") && "childNodes" in node)
                for (const child of node.childNodes) {
                    if ("value" in child) fragments.push(child.value);
                }
        }
        if ("childNodes" in node) for (const child of node.childNodes) visit(child);
    }
    visit(ast);
    return fragments;
}

export function findMissingAssetReferences(
    sources: ReadonlyMap<string, string>,
    existingAssets: ReadonlySet<string>,
): string[] {
    const missing = new Set<string>();
    const directories = new Set<string>();
    for (const asset of existingAssets) {
        let slash = asset.lastIndexOf("/");
        while (slash > 0) {
            directories.add(asset.slice(0, slash));
            slash = asset.lastIndexOf("/", slash - 1);
        }
    }
    for (const [source, contents] of sources) {
        for (const fragment of resourceFragments(source, contents))
            for (const match of fragment.matchAll(assetReferencePattern)) {
                const reference = match[0];
                const exists = existingAssets.has(reference) || directories.has(reference);
                if (!exists) missing.add(`${source} -> ${reference}`);
            }
    }
    return [...missing];
}
