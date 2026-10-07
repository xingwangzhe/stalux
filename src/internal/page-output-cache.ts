import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface CachedPageOutput {
    html: string;
    font?: { filename: string; sourcePath: string };
}

const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

/** Content hashes include dependencies even when their public URL has not changed. */
export async function createPageOutputCache(
    directory: string,
    dependencies: readonly string[],
    font?: Buffer,
    assets: readonly string[] = [],
) {
    const hash = createHash("sha256").update("stalux-page-output-v1\0");
    if (font) hash.update(font);
    for (const dependency of [...dependencies].sort()) {
        hash.update(dependency).update("\0");
        hash.update(await fs.readFile(dependency)).update("\0");
    }
    const namespace = path.join(directory, hash.digest("hex"));
    await fs.mkdir(namespace, { recursive: true });
    const assetDigests = new Map<string, string>();
    for (const asset of assets) assetDigests.set(asset, digest(await fs.readFile(asset)));
    const key = (entry: string, html: string) => digest(`${entry}\0${html}`);
    return {
        async get(entry: string, html: string): Promise<CachedPageOutput | undefined> {
            try {
                const record = JSON.parse(
                    await fs.readFile(path.join(namespace, `${key(entry, html)}.json`), "utf8"),
                );
                if (typeof record.html !== "string" || digest(record.html) !== record.digest)
                    return undefined;
                if (!Array.isArray(record.assets)) return undefined;
                for (const [asset, expected] of record.assets) {
                    if ((assetDigests.get(asset) ?? null) !== expected) return undefined;
                }
                if (record.font) {
                    if (
                        !/^page-[a-f\d]+\.woff2$/u.test(record.font.filename) ||
                        typeof record.font.sourcePath !== "string" ||
                        !(await fs.stat(record.font.sourcePath)).isFile()
                    )
                        return undefined;
                }
                return { html: record.html, font: record.font };
            } catch {
                // Missing, truncated, or invalid cache entries are rebuilt from source.
                return undefined;
            }
        },
        async set(
            entry: string,
            html: string,
            output: CachedPageOutput,
            referencedAssets: readonly string[] = [],
        ): Promise<void> {
            const target = path.join(namespace, `${key(entry, html)}.json`);
            const temporary = `${target}.${process.pid}.tmp`;
            await fs.writeFile(
                temporary,
                JSON.stringify({
                    ...output,
                    digest: digest(output.html),
                    assets: referencedAssets.map((asset) => [
                        asset,
                        assetDigests.get(asset) ?? null,
                    ]),
                }),
            );
            await fs.rename(temporary, target);
        },
    };
}
